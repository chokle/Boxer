import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.post("/analyze", async (req, res) => {
  const {
    title,
    match_context,
    opponent_style,
    match_description,
    boxer_profile,
    images,
    has_video,
  } = req.body;

  if (!boxer_profile) {
    res.status(400).json({ error: "boxer_profile is required" });
    return;
  }

  const hasImages = Array.isArray(images) && images.length > 0;
  const hasDescription = typeof match_description === "string" && match_description.trim().length > 0;
  const hasMedia = hasImages || has_video;

  if (!hasDescription && !hasMedia) {
    res.status(400).json({ error: "Please provide a match description or upload media for analysis" });
    return;
  }

  const systemPrompt = `You are an elite boxing coach AI with expertise in technical analysis of boxing performance.
You analyze ${hasDescription ? "match descriptions" : ""}${hasDescription && hasMedia ? " and " : ""}${hasImages ? "images" : has_video ? "video footage" : ""} and provide detailed, actionable coaching feedback.
${hasImages ? "When images are provided, analyze the visible technique, stance, positioning, guard position, footwork, weight distribution, and any observable form issues. Make your visual analysis the primary basis for scoring.\n" : ""}${!hasDescription ? "No written description was provided — base your entire analysis on the boxer's profile, match context, and the provided media. Infer performance details from what you can observe or what is reasonable given the context.\n" : ""}Always respond with valid JSON matching the specified schema.
Your scoring is rigorous: 70+ is good, 80+ is excellent, 90+ is elite.`;

  const mediaContext = hasImages
    ? `\nMEDIA: ${images.length} image(s) attached — analyze visual technique carefully from these images.`
    : has_video
      ? "\nMEDIA: A video recording of the session was uploaded. Use this as evidence when evaluating performance."
      : "";

  const descriptionBlock = hasDescription
    ? `\nMATCH DESCRIPTION / OBSERVATIONS:\n${match_description}`
    : "\nNOTE: No written description provided. Infer performance from the boxer's profile, match context, and uploaded media.";

  const userPrompt = `Analyze the following boxing performance and provide scores and tactical feedback.

BOXER PROFILE:
- Name: ${boxer_profile.name || "Unknown"}
- Stance: ${boxer_profile.stance || "Orthodox"}
- Experience: ${boxer_profile.experience_level || "Intermediate"}
- Weight Class: ${boxer_profile.weight_class || "Unknown"}

MATCH CONTEXT: ${match_context || "training"}
OPPONENT STYLE: ${opponent_style || "balanced"}
MATCH TITLE: ${title || "Session"}
${mediaContext}
${descriptionBlock}

Return a JSON object with this exact structure:
{
  "overall_score": <0-100>,
  "stance_score": <0-100>,
  "offense_score": <0-100>,
  "defense_score": <0-100>,
  "footwork_score": <0-100>,
  "combination_score": <0-100>,
  "stance_feedback": "<2-3 sentences on stance and guard>",
  "offense_feedback": "<2-3 sentences on punching offense>",
  "defense_feedback": "<2-3 sentences on defensive technique>",
  "footwork_feedback": "<2-3 sentences on movement and footwork>",
  "combination_feedback": "<2-3 sentences on combinations and flow>",
  "tactical_summary": "<3-4 sentence overall tactical assessment>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvement_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "shot_accuracy": <0-100 percentage>,
  "punches_thrown": <estimated integer>,
  "punches_landed": <estimated integer>,
  "drills": [
    {
      "category": "<footwork|offense|defense|stamina|combination>",
      "name": "<drill name>",
      "description": "<what to do and why>",
      "duration": "<e.g. 3 x 3-minute rounds>",
      "difficulty": "<Easy|Medium|Hard>",
      "focus_area": "<specific technique being trained>",
      "reps": "<e.g. 10 reps per side>"
    }
  ]
}`;

  try {
    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" | "low" | "auto" } };

    const userContent: ContentPart[] = [{ type: "text", text: userPrompt }];

    if (hasImages) {
      for (const b64 of images.slice(0, 5)) {
        const dataUrl = b64.startsWith("data:")
          ? b64
          : `data:image/jpeg;base64,${b64}`;
        userContent.push({
          type: "image_url",
          image_url: { url: dataUrl, detail: "high" },
        });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 2500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: hasImages ? userContent : userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Invalid AI response format" });
      return;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json({ success: true, analysis });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze match");
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

export default router;
