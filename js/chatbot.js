/* --- Bhagawan AI Chat Bot Logic --- */

document.addEventListener('DOMContentLoaded', () => {
    // FAQ Knowledge Base
    const qaPairs = [
        {
            keywords: ['service', 'provide', 'what do you do', 'offer'],
            question: "What services does Bhagawan IT provide?",
            answer: "We offer comprehensive web development, mobile app development, custom software solutions, and IT consulting tailored for businesses in Nepal."
        },
        {
            keywords: ['best', 'why choose', 'top', 'quality'],
            question: "Why is Bhagawan IT the best?",
            answer: "We combine high-end design, bank-grade security, and unbeatable local pricing. Our team uses global standards to deliver unmatched value to clients in Kathmandu and beyond."
        },
        {
            keywords: ['time', 'how long', 'duration', 'days', 'weeks'],
            question: "How long does it take to build a website?",
            answer: "A standard website usually takes 7-14 days. Complex custom systems or mobile apps may take 4-8 weeks or more depending on project scope."
        },
        {
            keywords: ['support', 'after', 'maintenance', 'help'],
            question: "Do you provide support after launch?",
            answer: "Absolutely! We offer 24/7 dedicated support and various tiered maintenance plans to ensure your systems are always updated and secure."
        },
        {
            keywords: ['price', 'cost', 'fee', 'charge', 'expensive'],
            question: "What is your pricing model?",
            answer: "We believe in transparent, local pricing. We offer fixed-price contracts for defined projects and time-and-materials retainers for agile projects. Our setup starts as low as Rs. 7,499."
        },
        {
            keywords: ['security', 'safe', 'secure', 'protect', 'data'],
            question: "How do you ensure security?",
            answer: "Security is built-in from day one. We adhere to OWASP standards, use high-grade encryption, and conduct penetration testing to ensure your data is bank-grade secure."
        },
        {
            keywords: ['system', 'existing', 'integrate', 'legacy'],
            question: "Can you work with our existing systems?",
            answer: "Yes, we have extensive experience building custom APIs and integrations to connect new platforms with your existing CRM, ERP, or databases."
        },
        {
            keywords: ['book', 'meeting', 'consultation', 'talk', 'contact', 'appointment'],
            question: "How do I book a meeting?",
            answer: "I'd the happy to help! You can book a free consultation directly through our booking form. <br><a href='contact.html#booking-section' class='booking-link'>Book a Meeting Now 🗓️</a>"
        }
    ];

    const botConfig = {
        name: "Bhagawan AI",
        tagline: "Your Digital Success Partner",
        welcomeMsg: "Namaste! 🙏 I'm Bhagawan AI. How can I help you today?",
        fallbackMsg: "I'm sorry, I didn't quite catch that. Could you please rephrase your question? Or would you like to book a meeting?"
    };

    // Inject Chat UI
    const chatHTML = `
        <button class="chatbot-bubble" id="chatBubble" aria-label="Open chat">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        </button>
        <div class="chatbot-window" id="chatWindow">
            <div class="chatbot-header">
                <div class="chatbot-avatar">B</div>
                <div class="chatbot-info">
                    <h3>${botConfig.name}</h3>
                    <p>${botConfig.tagline}</p>
                </div>
                <button class="chatbot-close" id="closeChat">&times;</button>
            </div>
            <div class="chatbot-messages" id="chatMessages">
                <div class="message bot">${botConfig.welcomeMsg}</div>
            </div>
            <div class="chatbot-quick-replies" id="quickReplies">
                <button class="quick-reply-btn">Our Services</button>
                <button class="quick-reply-btn">Pricing</button>
                <button class="quick-reply-btn">Security</button>
                <button class="quick-reply-btn">Book a Meeting</button>
            </div>
            <form class="chatbot-input-area" id="chatForm">
                <input type="text" class="chatbot-input" id="chatInput" placeholder="Type your question..." autocomplete="off">
                <button type="submit" class="chatbot-send">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </form>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const bubble = document.getElementById('chatBubble');
    const window = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChat');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const quickReplies = document.getElementById('quickReplies');

    // Toggle Chat
    bubble.addEventListener('click', () => {
        window.classList.add('active');
        bubble.style.display = 'none';
        chatInput.focus();
    });

    closeBtn.addEventListener('click', () => {
        window.classList.remove('active');
        bubble.style.display = 'flex';
    });

    // Handle Quick Replies
    quickReplies.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply-btn')) {
            handleUserMessage(e.target.textContent);
        }
    });

    // Handle Form Submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
            handleUserMessage(text);
            chatInput.value = '';
        }
    });

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function handleUserMessage(text) {
        addMessage(text, 'user');
        
        const typing = showTyping();
        
        setTimeout(() => {
            typing.remove();
            const response = findBestMatch(text);
            addMessage(response, 'bot');
        }, 1000);
    }

    function findBestMatch(input) {
        const lowerInput = input.toLowerCase();
        
        // Find match in QA pairs
        let bestMatch = null;
        let highestScore = 0;

        qaPairs.forEach(pair => {
            let score = 0;
            pair.keywords.forEach(kw => {
                if (lowerInput.includes(kw)) score++;
            });
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = pair;
            }
        });

        if (bestMatch && highestScore > 0) {
            return bestMatch.answer;
        }

        return botConfig.fallbackMsg;
    }
    
    // Listen for global queries
    document.addEventListener('bhagawanAiQuery', (e) => {
        handleUserMessage(e.detail);
    });

});

/**
 * Global trigger for chatbot (accessible from anywhere)
 */
window.openBhagawanAI = (query = '') => {
    const bubble = document.getElementById('chatBubble');
    const window = document.getElementById('chatWindow');
    const input = document.getElementById('chatInput');
    
    if (bubble && window) {
        // Trigger the click logic
        window.classList.add('active');
        bubble.style.display = 'none';
        
        if (input) {
            input.focus();
            if (query) {
                // If there's a query, we need to pass it to the chat bot logic
                // We'll dispatch a custom event that the chatbot script listens for
                const event = new CustomEvent('bhagawanAiQuery', { detail: query });
                document.dispatchEvent(event);
            }
        }
    } else {
        console.error('Bhagawan AI: Chat elements not found.');
    }
};
