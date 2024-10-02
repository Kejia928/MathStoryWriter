import init, { TokenizerWasm } from "./tokenizers-wasm/tokenizers_wasm.js";


window.tvmjsGlobalEnv = window.tvmjsGlobalEnv || {};

async function initialize() {
    var initialized = false;

    async function getTokenizer(name) {
        if (!initialized) {
            await init();
            initialized = true;
        }
        const jsonText = await (await fetch("https://huggingface.co/" + name + "/raw/main/tokenizer.json")).text();
        return new TokenizerWasm(jsonText);
    }

    tvmjsGlobalEnv.getTokenizer = getTokenizer;

    var localStableDiffusionInst = new StableDiffusionInstance();

    tvmjsGlobalEnv.asyncOnGenerate = async function () {
        await localStableDiffusionInst.generate();
    };
}

function generateOnClick() {
    initialize().then(() => {
        tvmjsGlobalEnv.asyncOnGenerate();
    });
}

document.getElementById("generate-btn").addEventListener("click", generateOnClick);