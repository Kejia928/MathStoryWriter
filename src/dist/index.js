import { PromptTemplate } from './prompt.js';
import * as webllm from "https://esm.run/@mlc-ai/web-llm";

/** Globle Variable */
// Create engine instance
const engine = new webllm.MLCEngine();
const storyContent = []
const storyScenes = [];
var storyIndex = 0;

/** WebLLM Logic */
// Callback function for initializing progress
function updateEngineInitProgressCallback(report) {
    console.log("initialize", report.progress);
    document.getElementById("download-status").textContent = report.text;
}

async function initializeWebLLMEngine() {
    var selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC";
    engine.setInitProgressCallback(updateEngineInitProgressCallback);
    document.getElementById("download-status").classList.remove("hidden");
    const config = {
        temperature: 1.0,
        top_p: 1,
    };
    await engine.reload(selectedModel, config);
}

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

async function llmInference(messages, onError) {
    console.log(messages);
    try {
        let curMessage = "";
        const completion = await engine.chat.completions.create({
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
        parseStory(curMessage);
        return curMessage;
    } catch (err) {
        onError(err);
    }
}

/** Generation Pipeline */
function getUserInput() {
    const mathProblem = document.getElementById("math-input").value;
    const storyScenerio = document.getElementById("scenerio-input").value;
    const storyCharacter = document.getElementById("characters-input").value;
    const SE = 'The story takes place in a ' + storyScenerio + ' scenario. The main characters are ' + storyCharacter + '.';
    const promptTemplate = new PromptTemplate();
    const userMessage = promptTemplate.interpolateUserMessageTemplate(mathProblem, SE);
    // console.log(promptTemplate.getSystemMessage());
    // console.log(userMessage);
    // console.log(promptTemplate.getExampleUserMessage()['User Message']);
    // console.log(promptTemplate.getExampleUserMessage()['Example Output']);
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

function updateUI(index) {
    storyIndex += index;
    document.getElementById("page-number").textContent = "Page " + storyIndex + " / " + storyContent.length;
    if (storyIndex < 0) {
        storyIndex = 0;
    } else if (storyIndex >= storyContent.length) {
        storyIndex = storyContent.length - 1;
    }
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


function generateButtonOnClick() { 
    document.getElementById("generate-button").disabled = true;
    var messages = getUserInput();
    llmInference(messages, console.error).then(() => {  
        document.getElementById("generate-button").disabled = false;
        updateUI(1);
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

