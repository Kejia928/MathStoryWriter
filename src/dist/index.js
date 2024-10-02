import { PromptTemplate } from './prompt.js';
import * as webllm from "https://esm.run/@mlc-ai/web-llm";
import init, { TokenizerWasm } from "./tokenizers-wasm/tokenizers_wasm.js";

/** Globle Variable */
// Create web llm engine instance
const llmEngine = new webllm.MLCEngine();
// Create stable diffusion instance
window.tvmjsGlobalEnv = window.tvmjsGlobalEnv || {};
var initialized = false;
async function getTokenizer(name) {
    if (!initialized) {
        await init();
    }
    const jsonText = await (await fetch("https://huggingface.co/" + name + "/raw/main/tokenizer.json")).text();
    console.log("Tokenizer Initialized");
    return new TokenizerWasm(jsonText);
}
tvmjsGlobalEnv.getTokenizer = getTokenizer;
var stableDiffusionEngine = new StableDiffusionInstance();
tvmjsGlobalEnv.asyncOnGenerate = async function (prompt, negPrompt, schedulerId, vaeCycle) {
    await stableDiffusionEngine.generate(prompt, negPrompt, schedulerId, vaeCycle);
};

// Story Content and Scene Description
var storyContent = [], storyScenes = [], storyImages = [];
var storyIndex = 0;

/** WebLLM Logic */
// Callback function for initializing progress
function updateEngineInitProgressCallback(report) {
    console.log("initialize", report.progress);
    document.getElementById("download-status").textContent = report.text;
}

// Initialize the webllm engine
async function initializeWebLLMEngine() {
    var selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC";
    llmEngine.setInitProgressCallback(updateEngineInitProgressCallback);
    document.getElementById("download-status").classList.remove("hidden");
    const config = {
        temperature: 1.0,
        top_p: 1,
    };
    await llmEngine.reload(selectedModel, config);
}

// Perform LLM Inference
async function llmInference(messages, onError) {
    console.log(messages);
    try {
        let curMessage = "";
        const completion = await llmEngine.chat.completions.create({
            stream: true,
            messages,
        });
        console.log("llmInference start");
        for await (const chunk of completion) {
            const curDelta = chunk.choices[0]?.delta.content;
            if (curDelta) {
                curMessage += curDelta;
            }
            console.log("Generating");
        }
        console.log(curMessage);
        return curMessage;
    } catch (err) {
        onError(err);
    }
}

/** Stable Diffusion Logic */
async function stableDiffusionInference(prompt) {
    console.log("Stable Diffusion Inference");
    var negPrompt = "";
    const schedulerId = 0; // Multi-step DMP Solver (20 steps)
    const vaeCycle = -1; // No render intermediate steps
    await tvmjsGlobalEnv.asyncOnGenerate(prompt, negPrompt, schedulerId, vaeCycle);
}

/** UI Logic */
function getUserInput() {
    const mathProblem = document.getElementById("math-input").value;
    const storyScenerio = document.getElementById("scenerio-input").value;
    const storyCharacter = document.getElementById("characters-input").value;
    const SE = 'The story takes place in a ' + storyScenerio + ' scenario. The main characters are ' + storyCharacter + '.';
    const promptTemplate = new PromptTemplate();
    const userMessage = promptTemplate.interpolateUserMessageTemplate(mathProblem, SE);
    const messages = [
        {
            content: promptTemplate.getSystemMessage(),
            role: "system",
        },
    ];
    messages.push({
        content: promptTemplate.getExampleUserMessage()['User Message'],
        role: "user",
    });
    messages.push({
        content: promptTemplate.getExampleUserMessage()['Example Output'],
        role: "assistant",
    });
    messages.push({
        content: userMessage,
        role: "user",
    });
    return messages;
}

// Parse Story Content
function parseStory(response) {
    console.log("Parsing Story");
    const lines = response.split('\n');
    lines.forEach(line => {
        if (line.includes('"story_text"')) {
            var content = line.split('""story_text"": "')[1].trim().replace(",", "").replace(/"/g, "");
            storyContent.push(content);
        } else if (line.includes('"image_description"')) {
            var content = line.split('""image_description"": "')[1].trim().replace(",", "").replace(/"/g, "");
            storyScenes.push(content);
        }
    });
    console.log(storyContent);
    console.log(storyScenes);
}

// Save Image from canvas
function saveImage(canvas, storyIndex) {
    var imageData = canvas.toDataURL("image/png");
    storyImages[storyIndex] = imageData;
    console.log("Image saved at index " + storyIndex);
    console.log(storyImages);
}

// Load Image from array
function loadImage(canvas, storyIndex) {
    if (!storyImages[storyIndex]) {
        console.log("No image found at index " + storyIndex);
        return;
    }
    var img = new Image();
    img.src = storyImages[storyIndex];
    img.onload = function () {
        if (!canvas.getContext('2d')) {
            console.error("Failed to get 2D context");
            return;
        }
        console.log("Image loaded from index " + storyIndex);
        canvas.getContext('2d').drawImage(img, 0, 0);
    };
}

// Update UI with Story Content
function updateUI(index) {
    document.getElementById("prev-page").disabled = true;
    document.getElementById("next-page").disabled = true;
    storyIndex += index;
    document.getElementById("page-number").textContent = "Page " + (storyIndex+1) + " / " + storyContent.length;
    if (storyIndex < 0) {
        storyIndex = 0;
    } else if (storyIndex >= storyContent.length) {
        storyIndex = storyContent.length - 1;
    }

    // Update story scene
    const imgCanvas = document.getElementById('image-display').querySelector("canvas");
    if (storyImages[storyIndex] == undefined) {
        console.log("undefined, generating image");
        stableDiffusionInference(storyScenes[storyIndex]).then(() => {
            saveImage(imgCanvas, storyIndex);
        });
    } else {
        console.log("not undefined, using existing image");
        // imgCanvas.getContext('2d').clearRect(0, 0, imgCanvas.width, imgCanvas.height);
        loadImage(imgCanvas, storyIndex);
    }


    // Update story content
    const storyCanvas = document.getElementById('story-display').querySelector("canvas");
    const ctx = storyCanvas.getContext('2d');
    ctx.clearRect(0, 0, storyCanvas.width, storyCanvas.height);
    ctx.font = '18px Arial';
    ctx.fillStyle = 'black';
    const maxWidth = storyCanvas.width - 20;
    const lineHeight = 30;
    const x = 10;
    let y = 50;
    if (storyContent[storyIndex]) {
        wrapText(ctx, storyContent[storyIndex], x, y, maxWidth, lineHeight);
    }
}

// Wrap Text Function for Canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
            ctx.fillText(line, x, y);
            line = words[i] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

/** Generation Pipeline */
function cleanArray() {
    storyContent = [];
    storyScenes = [];
    storyIndex = 0;
}

function generateButtonOnClick() {
    cleanArray();
    document.getElementById("generate-button").disabled = true;
    var messages = getUserInput();
    llmInference(messages, console.error).then((curMessage) => {
        parseStory(curMessage);
        updateUI(0);
        document.getElementById("generate-button").disabled = false;
        document.getElementById("next-page").disabled = false;
    });
}

/** UI Binding */
document.getElementById("init-button").addEventListener("click", function () {
    initializeWebLLMEngine().then(() => {
        document.getElementById("generate-button").disabled = false;
        document.getElementById("init-button").disabled = true;
    });
});
document.getElementById("generate-button").addEventListener("click", function () {
    generateButtonOnClick();
    document.getElementById("next-page").disabled = false;
});

// document.getElementById("generate-button").addEventListener("click", stableDiffusionInference);


document.getElementById("prev-page").addEventListener("click", function () {
    updateUI(-1);
    if (storyIndex === 0) {
        document.getElementById("prev-page").disabled = true;
    }
    if (storyIndex < storyContent.length) {
        document.getElementById("next-page").disabled = false;
    }
});

document.getElementById("next-page").addEventListener("click", function () {
    updateUI(1);
    if (storyIndex === storyContent.length - 1) {
        document.getElementById("next-page").disabled = true;
    }
    if (storyIndex >= 0) {
        document.getElementById("prev-page").disabled = false;
    }
});
