document.addEventListener("DOMContentLoaded", function () {
  
    new Granim({
        element: "#gradient-canvas",
        direction: "diagonal",
        isPausedWhenNotInView: true,
        states: {
            "default-state": {
                gradients: [
                    ["#a960ee", "#ff333d"],
                    ["#90e0ff", "#ffcb57"],
                    ["#ff333d", "#a960ee"],
                ],
                transitionSpeed: 2000,
            },
        },
    });
});


const prompt = document.querySelector("#prompt");
const chatContainer = document.querySelector(".container");
const imageBtn = document.querySelector("#image");
const imageIcon = document.querySelector("#image img");
const imageInput = document.querySelector("#doc");


let user = {
    message: null,
    file: {
        mime_type: null,
        data: null,
    },
};

const debounce = (func, delay) => {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
};


const scrollToBottom = debounce(() => {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
    });
}, 50);


imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string,
        };
        imageIcon.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        imageIcon.style.border = "2px solid #90e0ff"; 
    };

    reader.onerror = (err) => {
        console.error("Error reading file:", err);
        alert("There was an error with your file upload. Please try again.");
    };

    reader.readAsDataURL(file);
});

imageBtn.addEventListener("click", () => {
    imageInput.click();
});

async function generateResponse(aichatBox) {
    const text = aichatBox.querySelector(".ai-chatarea");
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyC1-DiNyUekf6i1Jz_3T3V3199YPKtmWzY"; // Replace with actual API key

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: user.message },
                            ...(user.file.data ? [{ inline_data: user.file }] : []),
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const apiResponse =
            data.candidates && data.candidates.length > 0
                ? data.candidates[0].content.parts[0].text
                      .replace(/\*\*(.*?)\*\*/g, "$1") 
                      .trim()
                : "Sorry, I couldn’t process that.";

     
        text.innerHTML = formatResponse(apiResponse);
    } catch (err) {
        console.error("Error fetching AI response:", err);
        text.innerHTML = "Oops! Something went wrong. Please try again.";
    } finally {
        scrollToBottom();
        imageIcon.src = `picture.png`; 
        user.file = {};
    }
}

function formatResponse(response) {

    return response.replace(/([.!?])\s*(?=[A-Z])/g, "$1\n\n");
}


function handleChatResponse(message) {
    user.message = message;

    const html = `<img src="woman.png" alt="" id="user-img" height="40px">
            <div class="user-chatarea">
        ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
               ${user.message}
            </div>`;

    const userChatbox = createChatbox(html, "user-chatbox");
    chatContainer.appendChild(userChatbox);
    prompt.value = "";

    scrollToBottom();
    setTimeout(() => {
        const aiHtml = `
            <img src="ai-technology.png" alt="" id="ai-img" height="40px">
            <div class="ai-chatarea">
              <img src="Animation - 1736863280194.gif" alt="" class="load" width="100px">
            </div>`;
        const aiChatbox = createChatbox(aiHtml, "ai-chatbox");
        chatContainer.appendChild(aiChatbox);
        generateResponse(aiChatbox);
    }, 600);
}


function createChatbox(html, classes) {
    const div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}


prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && prompt.value.trim() !== "") {
        handleChatResponse(prompt.value.trim());
    }
});
