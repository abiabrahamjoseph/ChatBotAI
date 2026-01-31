import OpenAI from 'openai';

export const sendMessageToAI = async (messages, apiKey, model = 'gpt-3.5-turbo') => {
    if (!apiKey) {
        throw new Error('API Key is missing');
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side only apps
    });

    try {
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: model,
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error calling AI API:', error);
        throw error;
    }
};
