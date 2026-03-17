import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");

    const { procedureName, packageName, packagePrice, hospitalName, packageIncludes } = await req.json();

    if (!procedureName || !packageName || !packagePrice || !hospitalName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValidHttpUrl = (value: string) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    };

    const checkUrlReachable = async (url: string) => {
      if (!isValidHttpUrl(url)) return false;
      try {
        const headRes = await fetch(url, { method: "HEAD", redirect: "follow" });
        // Accept 2xx-4xx as reachable; many hospital sites block bots with 403 but links still work in browsers
        if (headRes.status < 500) return true;
      } catch {
        // Some sites block HEAD; fallback to GET below
      }
      try {
        const getRes = await fetch(url, { method: "GET", redirect: "follow" });
        return getRes.status < 500;
      } catch {
        return false;
      }
    };

    const buildGoogleProofUrl = (hospital: string, procedure: string) =>
      `https://www.google.com/search?q=${encodeURIComponent(`${hospital} ${procedure} package price Malaysia`)}`;

    const screenshotToDataUrl = async (screenshot: unknown) => {
      if (typeof screenshot !== "string" || !screenshot.trim()) return "";

      const raw = screenshot.trim();

      if (raw.startsWith("data:image/")) {
        return raw;
      }

      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        try {
          const imageResponse = await fetch(raw);
          if (!imageResponse.ok) {
            console.error(`Screenshot URL fetch failed [${imageResponse.status}] for ${raw}`);
            return "";
          }

          const contentType = imageResponse.headers.get("content-type") || "image/png";
          const bytes = new Uint8Array(await imageResponse.arrayBuffer());
          const chunkSize = 0x8000;
          let binary = "";

          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }

          return `data:${contentType};base64,${btoa(binary)}`;
        } catch (error) {
          console.error("Failed to download screenshot URL:", error);
          return "";
        }
      }

      const compact = raw.replace(/\s+/g, "");
      if (!/^[A-Za-z0-9+/=]+$/.test(compact)) {
        return "";
      }

      return `data:image/png;base64,${compact}`;
    };

    const extractMarkdownImageUrls = (markdown: string) => {
      const matches = Array.from(markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g));
      return [...new Set(matches.map((match) => match[1]))];
    };

    const pickRelevantPromoImageUrl = (imageUrls: string[], hospital: string, procedure: string) => {
      const strongKeywords = ["package", "promotion", "promo", "knee", "tkr", "replacement", "ortho", "implant"];
      const weakKeywords = [...hospital.toLowerCase().split(/\s+/), ...procedure.toLowerCase().split(/\s+/)].filter((word) => word.length > 3);
      const ignoreKeywords = ["logo", "icon", "calendar", "facebook", "twitter", "youtube", "instagram", "spinner", "menu", "close", "home", "language"];

      const scored = imageUrls
        .map((url) => {
          const normalized = url.toLowerCase();
          let score = 0;

          if (strongKeywords.some((keyword) => normalized.includes(keyword))) score += 4;
          if (weakKeywords.some((keyword) => normalized.includes(keyword))) score += 1;
          if (ignoreKeywords.some((keyword) => normalized.includes(keyword))) score -= 6;

          return { url, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

      return scored[0]?.url || "";
    };

    // ==========================================
    // STEP 1: Gemini provides competitor pricing from its knowledge
    // ==========================================
    console.log("Step 1: Gemini providing competitor pricing...");

    const systemPrompt = `You are a medical package survey specialist with deep expertise in Malaysian private hospital pricing. Your role is to survey and provide accurate medical package pricing across various private hospitals.

IMPORTANT RULES:
1. Return exactly 2 competitor hospitals near the same region/city as ${hospitalName}.
2. Use real Malaysian private hospital names (e.g., Gleneagles, Pantai, Sunway Medical, Prince Court, Columbia Asia, Island Hospital, Subang Jaya Medical Centre, etc.)
3. Prices must be realistic for Malaysian private hospitals in RM.
4. Return valid JSON only, no markdown.
5. For the websiteUrl field, provide a Google search URL that links to the relevant content, formatted as: https://www.google.com/search?q=[hospital name]+${procedureName}+package+price+Malaysia
6. Provide your best knowledge of the actual package prices these hospitals charge.`;

    const userPrompt = `As a medical package survey specialist, can you provide the ${procedureName} package across various private hospitals near ${hospitalName} in Malaysia? How much does it cost and what is included?

For each hospital, provide:
1. The package price in RM
2. What is included in the package
3. A Google search URL for verification

Reference comparison:
- Hospital: ${hospitalName}
- Package: ${packageName}
- Reference Price: RM ${packagePrice}
- Package Includes: ${packageIncludes.join(", ")}`;

    const step1Response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_competitors",
              description: "Return competitor hospital package data",
              parameters: {
                type: "object",
                properties: {
                  competitors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        hospitalName: { type: "string" },
                        packageName: { type: "string" },
                        packagePrice: { type: "number" },
                        packageIncludes: { type: "array", items: { type: "string" } },
                        location: { type: "string" },
                        websiteUrl: { type: "string" },
                      },
                      required: ["hospitalName", "packageName", "packagePrice", "packageIncludes", "location", "websiteUrl"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["competitors"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_competitors" } },
      }),
    });

    if (!step1Response.ok) {
      if (step1Response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await step1Response.text();
      console.error("Step 1 AI error:", step1Response.status, errText);
      throw new Error(`AI gateway error: ${step1Response.status}`);
    }

    const step1Data = await step1Response.json();
    const toolCall = step1Data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const competitors = parsed.competitors || [];
    console.log(`Step 1 complete. Got ${competitors.length} competitors from Gemini:`, JSON.stringify(competitors.map((c: any) => ({ name: c.hospitalName, price: c.packagePrice }))));

    // ==========================================
    // STEP 2: Firecrawl search to verify each competitor's pricing
    // ==========================================
    console.log("Step 2: Verifying prices with Firecrawl search...");

    const verifiedCompetitors = await Promise.all(
      competitors.map(async (comp: any) => {
        const searchQuery = `${comp.hospitalName} ${procedureName} package price RM Malaysia`;
        console.log(`Searching: "${searchQuery}"`);

        try {
          // Step 2a: Firecrawl search for text-based results
          const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: searchQuery,
              limit: 3,
              scrapeOptions: { formats: ["markdown"] },
            }),
          });

          const searchData = await searchResponse.json();

          if (!searchResponse.ok) {
            console.error(`Firecrawl search failed for ${comp.hospitalName}:`, searchData);
            return { ...comp, priceVerified: false, verificationNote: "Search failed" };
          }

          const results = searchData?.data || [];
          console.log(`Got ${results.length} search results for ${comp.hospitalName}`);

          const candidateResultUrls = results
            .map((r: any) => r?.url)
            .filter((url: string) => typeof url === "string" && isValidHttpUrl(url));

          const hospitalKeyword = String(comp.hospitalName || "").split(" ")[0]?.toLowerCase();
          const preferredResultUrl =
            candidateResultUrls.find(
              (url: string) => !url.includes("google.com") && hospitalKeyword && url.toLowerCase().includes(hospitalKeyword)
            ) ||
            candidateResultUrls.find((url: string) => !url.includes("google.com")) ||
            candidateResultUrls[0] ||
            "";

          const proofFallbackUrl = buildGoogleProofUrl(comp.hospitalName, procedureName);
          const topResultUrl = preferredResultUrl || proofFallbackUrl;

          // Combine text content from search results
          const combinedSearchContent = results
            .map((r: any) => `Source: ${r.url || "unknown"}\n${r.markdown || r.description || ""}`)
            .join("\n---\n");

          // Step 3: Firecrawl scrapes screenshot (+ markdown) of the top search result page
          let screenshotDataUrl = "";
          let scrapedPageMarkdown = "";
          let promoImageDataUrl = "";

          if (topResultUrl) {
            console.log(`Scraping screenshot from: ${topResultUrl}`);
            try {
              const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: topResultUrl,
                  formats: ["markdown", "screenshot"],
                  waitFor: 3000,
                }),
              });

              const scrapeData = await scrapeResponse.json();
              const screenshotRaw = scrapeData?.data?.screenshot || scrapeData?.screenshot || "";
              scrapedPageMarkdown = String(scrapeData?.data?.markdown || scrapeData?.markdown || "");
              screenshotDataUrl = await screenshotToDataUrl(screenshotRaw);

              if (screenshotDataUrl) {
                console.log(`Prepared screenshot image for ${comp.hospitalName}`);
              } else if (screenshotRaw) {
                console.error(`Unsupported screenshot format for ${comp.hospitalName}`);
              }

              const markdownImageUrls = extractMarkdownImageUrls(scrapedPageMarkdown).slice(0, 25);
              const promoImageUrl = pickRelevantPromoImageUrl(markdownImageUrls, comp.hospitalName, procedureName);
              if (promoImageUrl) {
                promoImageDataUrl = await screenshotToDataUrl(promoImageUrl);
                if (promoImageDataUrl) {
                  console.log(`Prepared promo image for ${comp.hospitalName}: ${promoImageUrl}`);
                }
              }
            } catch (scrapeErr) {
              console.error(`Screenshot scrape failed for ${comp.hospitalName}:`, scrapeErr);
            }
          }

          const combinedContent = [
            combinedSearchContent,
            scrapedPageMarkdown ? `Top page content (${topResultUrl}):\n${scrapedPageMarkdown}` : "",
          ]
            .filter(Boolean)
            .join("\n---\n")
            .slice(0, 8000);

          if ((!combinedContent || combinedContent.length < 50) && !screenshotDataUrl && !promoImageDataUrl) {
            console.log(`No useful content for ${comp.hospitalName}`);
            return { ...comp, priceVerified: false, verificationNote: "No search results found" };
          }

          // Step 4: Gemini 2.5 Flash (vision) analyzes text + screenshot for exact pricing
          const userContent: any[] = [];
          const verificationText = (screenshotDataUrl || promoImageDataUrl)
            ? combinedContent.slice(0, 3000)
            : combinedContent;

          let textPrompt = `Hospital: ${comp.hospitalName}\nClaimed price: RM ${comp.packagePrice}\n\n`;
          if (verificationText && verificationText.length >= 50) {
            textPrompt += `Search/page content (text):\n${verificationText}\n\n`;
          }
          textPrompt += `Is the claimed price accurate? If you find the actual price from any source (text or image), what is it?`;

          if (screenshotDataUrl || promoImageDataUrl) {
            userContent.push({
              type: "text",
              text: textPrompt + "\n\nI've also attached screenshots/images from the hospital package page. Please extract the exact package price even if it appears only inside banners or promotional graphics.",
            });

            if (screenshotDataUrl) {
              userContent.push({
                type: "image_url",
                image_url: { url: screenshotDataUrl },
              });
            }

            if (promoImageDataUrl && promoImageDataUrl !== screenshotDataUrl) {
              userContent.push({
                type: "image_url",
                image_url: { url: promoImageDataUrl },
              });
            }
          } else {
            userContent.push({ type: "text", text: textPrompt });
          }

          const verifyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: `You verify medical package prices. You are given search results and optionally a screenshot of a hospital's package page. Extract the EXACT price shown — including prices embedded in images, banners, or promotional graphics. For the ${procedureName} package at a Malaysian hospital, determine if the claimed price of RM ${comp.packagePrice} is accurate.`,
                },
                {
                  role: "user",
                  content: userContent,
                },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "verify_price",
                    description: "Return verification result",
                    parameters: {
                      type: "object",
                      properties: {
                        priceFound: { type: "boolean", description: "Whether a price was found in text or screenshot" },
                        actualPrice: { type: "number", description: "The actual price found (from text or image), or 0 if not found" },
                        priceMatches: { type: "boolean", description: "Whether the claimed price approximately matches (within 20%)" },
                        sourceUrl: { type: "string", description: "URL of the source where price was found" },
                        priceSource: { type: "string", description: "Where the price was found: 'text', 'screenshot', or 'not_found'" },
                        evidenceSnippet: { type: "string", description: "The exact text snippet or sentence from the source that contains the price. Quote it verbatim if from text, or describe what was seen if from screenshot (e.g. 'Banner shows: Total Knee Replacement Package RM 35,000'). Keep under 150 chars." },
                      },
                      required: ["priceFound", "actualPrice", "priceMatches", "sourceUrl", "priceSource", "evidenceSnippet"],
                      additionalProperties: false,
                    },
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "verify_price" } },
            }),
          });

          let verification = {
            priceFound: false,
            actualPrice: 0,
            priceMatches: false,
            sourceUrl: topResultUrl || proofFallbackUrl,
            priceSource: "not_found",
            evidenceSnippet: "",
          };

          if (!verifyResponse.ok) {
            const verifyErr = await verifyResponse.text();
            console.error(`Verification AI failed for ${comp.hospitalName} [${verifyResponse.status}]: ${verifyErr}`);
          } else {
            const verifyData = await verifyResponse.json();
            const verifyCall = verifyData.choices?.[0]?.message?.tool_calls?.[0];
            if (verifyCall?.function?.arguments) {
              verification = JSON.parse(verifyCall.function.arguments);
            } else {
              console.error(`No verification tool call for ${comp.hospitalName}`);
            }
          }

          console.log(`Verification for ${comp.hospitalName}:`, JSON.stringify(verification));

          const finalPrice = verification.priceFound && verification.actualPrice > 0
            ? verification.actualPrice
            : comp.packagePrice;

          const urlCandidates = [
            verification.sourceUrl,
            topResultUrl,
            ...candidateResultUrls,
            comp.websiteUrl,
            proofFallbackUrl,
          ].filter((url: string) => typeof url === "string" && isValidHttpUrl(url));

          let finalUrl = proofFallbackUrl;
          for (const candidate of urlCandidates) {
            if (await checkUrlReachable(candidate)) {
              finalUrl = candidate;
              break;
            }
          }

          console.log(`Selected proof URL for ${comp.hospitalName}: ${finalUrl}`);

          const sourceLabel = verification.priceSource === "screenshot"
            ? "Price extracted from page screenshot"
            : "Price confirmed via web search";

          return {
            ...comp,
            packagePrice: finalPrice,
            websiteUrl: finalUrl,
            priceVerified: verification.priceFound,
            verificationNote: verification.priceFound
              ? sourceLabel
              : "Price from AI estimate (not found online)",
            evidenceSnippet: verification.evidenceSnippet || "",
          };
        } catch (err) {
          console.error(`Error verifying ${comp.hospitalName}:`, err);
          return { ...comp, priceVerified: false, verificationNote: "Verification error" };
        }
      })
    );

    // Filter out competitors with price 0
    const filtered = verifiedCompetitors.filter((c: any) => c.packagePrice > 0);
    console.log(`Returning ${filtered.length} competitors (${filtered.filter((c: any) => c.priceVerified).length} verified)`);

    return new Response(JSON.stringify({ competitors: filtered }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("competitor-comparison error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
