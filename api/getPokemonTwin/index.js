const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // 1. Get the image data from the incoming request from your website
    const base64Image = req.body?.image;
    const imageMimeType = req.body?.mimeType;

    if (!base64Image || !imageMimeType) {
        context.res = {
            status: 400,
            body: "Please pass an image and mimeType in the request body"
        };
        return;
    }

    // 2. Securely get the API Key from your Azure Application Settings
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = "https://pokiface-ai.openai.azure.com/"; // Your endpoint
    const deploymentName = "gpt-4o-mini"; // NOTE: You had gpt-4o-mini, make sure you have deployed "gpt-4o"
    const apiUrl = `${azureEndpoint}openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;

    // 3. Prepare the request to the Azure OpenAI service
    const prompt = `You are a Pokémon expert analyzing faces to find unique matches. Look at this person's face and determine which specific Pokémon they most resemble. IMPORTANT: Always give DIFFERENT and VARIED Pokémon matches - never repeat the same Pokémon. Consider diverse categories: Cute Pokémon (Pikachu, Eevee, Jigglypuff), Strong Pokémon (Charizard, Machamp), Unique Pokémon (Psyduck, Snorlax, Gengar). Analyze facial features like shape, eyes, and overall expression. Pick a SPECIFIC Pokémon that matches their features and personality. Respond with ONLY this JSON format (no markdown, no extra text): {"pokemon_name": "Specific Pokemon Name", "description": "You're like [Pokemon Name] - [2-3 engaging sentences explaining the match based on their facial features and personality traits]"}`;

    const requestBody = {
        messages: [{
            role: "system",
            content: prompt,
        }, {
            role: "user",
            content: [{
                type: "image_url",
                image_url: {
                    url: `data:${imageMimeType};base64,${base64Image}`,
                },
            }],
        }],
        max_tokens: 300,
        temperature: 0.7,
        response_format: { type: "json_object" },
    };

    try {
        // 4. Call the Azure OpenAI service from the secure server environment
        const openAIResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureApiKey,
            },
            body: JSON.stringify(requestBody)
        });

        if (!openAIResponse.ok) {
            const errorData = await openAIResponse.json();
            throw new Error(`Azure API Error: ${errorData.error?.message}`);
        }

        const result = await openAIResponse.json();
        const text = result.choices[0].message.content;

        // 5. Send the final result back to your website
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.parse(text)
        };

    } catch (error) {
        context.log.error(error);
        context.res = {
            status: 500,
            body: `Error calling AI service: ${error.message}`
        };
    }
};