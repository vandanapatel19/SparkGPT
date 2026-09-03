import imagekit from "../configs/imagekit.js"
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import axios from 'axios'
import openai from '../configs/openai.js'


// // Text-based AI message controller
// export const textMessageController = async (req, res) => {
//     try {
//         const userId = req.user._id;

//         // Check credits
//         if (req.user.credits < 1) {
//             return res.json({
//                 success: false,
//                 message: "You don't have enough credits to use this feature"
//             });
//         }

//         const { chatId, prompt } = req.body;

//         // Validate input
//         if (!chatId || !prompt) {
//             return res.status(400).json({
//                 success: false,
//                 message: "chatId and prompt are required"
//             });
//         }

//         // Find chat
//         const chat = await Chat.findOne({
//             userId,
//             _id: chatId
//         });

//         if (!chat) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Chat not found"
//             });
//         }

//         // Save user message
//         chat.messages.push({
//             role: "user",
//             isImage: false,
//             content: prompt,
//             timestamp: Date.now()
//         });

//         // Generate AI response
//         const { choices } = await openai.chat.completions.create({
//             model: "gemini-3.7-flash",
//             messages: [
//                 {
//                     role: "user",
//                     content: prompt
//                 }
//             ]
//         });

//         if (!choices || !choices[0] || !choices[0].message) {
//             return res.status(500).json({
//                 success: false,
//                 message: "No response received from AI"
//             });
//         }

//         const reply = {
//             ...choices[0].message,
//             isImage: false,
//             timestamp: Date.now()
//         };

//         // Save AI response
//         chat.messages.push(reply);
//         await chat.save();

//         // Deduct credit
//         await User.updateOne(
//             { _id: userId },
//             { $inc: { credits: -1 } }
//         );

//         return res.json({
//             success: true,
//             reply
//         });

//     } catch (error) {
//         console.error("Text generation error:", error);

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

export const textMessageController = async (req, res) => {
    console.log("========== TEXT API HIT ==========");

    try {
        console.log("1. User:", req.user?._id);
        console.log("2. Request body:", req.body);

        const userId = req.user._id;

        if (req.user.credits < 1) {
            return res.status(400).json({
                success: false,
                message: "You don't have enough credits"
            });
        }

        const { chatId, prompt } = req.body;

        console.log("3. Chat ID:", chatId);
        console.log("4. Prompt:", prompt);

        if (!chatId || !prompt) {
            return res.status(400).json({
                success: false,
                message: "chatId and prompt are required"
            });
        }

        console.log("5. Finding chat...");

        const chat = await Chat.findOne({
            _id: chatId,
            userId
        });

        console.log("6. Chat found:", !!chat);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        console.log("7. Calling Gemini...");

        const response = await openai.chat.completions.create({
            model: "gemini-3.7-flash",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        console.log("8. Gemini response received");

        console.log(response);

        const content = response?.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({
                success: false,
                message: "No response received from Gemini"
            });
        }

        console.log("9. AI content:", content);

        chat.messages.push({
            role: "user",
            isImage: false,
            content: prompt,
            timestamp: Date.now()
        });

        chat.messages.push({
            role: "assistant",
            isImage: false,
            content: content,
            timestamp: Date.now()
        });

        console.log("10. Saving chat...");

        await chat.save();

        console.log("11. Chat saved");

        await User.updateOne(
            { _id: userId },
            { $inc: { credits: -1 } }
        );

        console.log("12. Credit deducted");

        return res.json({
            success: true,
            reply: {
                role: "assistant",
                isImage: false,
                content,
                timestamp: Date.now()
            }
        });

    } catch (error) {

        console.error("========== TEXT ERROR ==========");
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        console.error("================================");

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Text generation failed"
        });
    }
};

// Image generation Message controller
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Check credits
        if (req.user.credits < 2) {
            return res.json({
                success: false,
                message: "You don't have enough credits to use this feature"
            });
        }

        const { prompt, chatId, isPublished } = req.body ?? {};

        if (!prompt || !chatId) {
            return res.status(400).json({
                success: false,
                message: "Prompt and chatId are required"
            });
        }

        // Find chat
        const chat = await Chat.findOne({
            userId,
            _id: chatId
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        // Push user message
        chat.messages.push({
            role: "user",
            isImage: false,
            content: prompt,
            timestamp: Date.now()
        });

        // Encode prompt
        const encodedPrompt = encodeURIComponent(prompt);

        // Create unique filename
        const fileName = `${Date.now()}.png`;

        // ImageKit AI generation URL
        const generatedImageUrl =
            `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/Sparkgpt/${fileName}`;

        console.log("Generating image...");
        console.log("ImageKit URL:", generatedImageUrl);

        // Wait for ImageKit AI to finish generation
        let aiImageResponse = null;

        for (let attempt = 1; attempt <= 50; attempt++) {

            try {
                const response = await axios.get(
                    generatedImageUrl,
                    {
                        responseType: "arraybuffer"
                    }
                );

                const contentType =
                    response.headers["content-type"];

                const isIntermediate =
                    response.headers["is-intermediate-response"];

                console.log(`Attempt ${attempt}`);
                console.log("Content-Type:", contentType);
                console.log("Intermediate:", isIntermediate);
                console.log("Size:", response.data.length);

                // Check if ImageKit has generated an actual image
                if (contentType?.startsWith("image/")) {

                    aiImageResponse = response;

                    console.log("✅ IMAGE GENERATED SUCCESSFULLY");

                    break;
                }

            } catch (error) {

                console.log(
                    `Attempt ${attempt} failed:`,
                    error.response?.status || error.message
                );
            }

            // Wait 2 seconds before trying again
            await new Promise(resolve =>
                setTimeout(resolve, 2000)
            );
        }

        // Check if image generation failed
        if (!aiImageResponse) {

            return res.status(500).json({
                success: false,
                message:
                    "ImageKit could not generate the image within the expected time."
            });
        }

        // Get actual image type
        const contentType =
            aiImageResponse.headers["content-type"];

        console.log(
            "Final image type:",
            contentType
        );

        // Determine correct extension
        let extension = "png";

        if (contentType === "image/jpeg") {
            extension = "jpg";
        } else if (contentType === "image/webp") {
            extension = "webp";
        } else if (contentType === "image/png") {
            extension = "png";
        }

        // Upload actual image bytes to ImageKit
        const uploadImage = await imagekit.upload({
            file: Buffer.from(aiImageResponse.data),
            fileName: `${Date.now()}.${extension}`,
            folder: "Sparkgpt"
        });

        console.log(
            "✅ Image uploaded:",
            uploadImage.url
        );

        // Create assistant reply
        const reply = {
            role: "assistant",
            isImage: true,
            content: uploadImage.url,
            timestamp: Date.now(),
            isPublished
        };

        // Save assistant message
        chat.messages.push(reply);

        await chat.save();

        // Deduct credits
        await User.updateOne(
            { _id: userId },
            { $inc: { credits: -2 } }
        );

        // Send response    
        return res.json({
            success: true,
            reply
        });

    } catch (error) {

        console.error(
            "Image generation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate image"
        });
    }
};



