
import React, { useState, useEffect, useRef } from 'react';

// Main App component
const App = () => {gemini
    // State variables gemini
    const [query, setQuery] = useState(''); // Stores the user's text query
    const [response, setResponse] = useState('Hello! How can I help you find local businesses in Addis Ababa today?'); // Stores the AI agent's response
    const [listening, setListening] = useState(false); // Indicates if the app is currently listening for voice input
    const [businessInfo, setBusinessInfo] = useState(''); // Stores simulated business information
    const [loading, setLoading] = useState(false); // Indicates if the AI is processing the query
    const [error, setError] = useState(''); // Stores any error messages
    const [imageData, setImageData] = useState(null); // Stores the base64 image data
    const [imagePreview, setImagePreview] = useState(null); // Stores the URL for image preview
    const [voices, setVoices] = useState([]); // Stores available speech synthesis voices
    const [selectedVoice, setSelectedVoice] = useState(null); // Stores the currently selected voice
    const [outputLanguage, setOutputLanguage] = useState('en'); // Stores the selected output language (en for English, am for Amharic)

    // Refs for speech recognition and synthesis
    const recognitionRef = useRef(null);
    const synthRef = useRef(null);

    // Initialize Web Speech API on component mount
    useEffect(() => {
        // Check if SpeechRecognition API is available
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Listen for a single utterance
            recognitionRef.current.lang = 'en-US'; // Set language

            // Event handler for when speech recognition results are available
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setQuery(transcript); // Set the query state with the transcribed text
                setListening(false); // Stop listening indicator
                handleSendQuery(transcript); // Automatically send the query
            };

            // Event handler for speech recognition errors
            recognitionRef.current.onerror = (event) => {
                setError(`Speech recognition error: ${event.error}`);
                console.error('Speech recognition error:', event.error);
                setListening(false);
            };

            // Event handler for when speech recognition ends
            recognitionRef.current.onend = () => {
                setListening(false);
            };
        } else {
            setError("Speech Recognition API not supported in this browser. Please use text input.");
        }

        // Initialize SpeechSynthesis API and load voices
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;

            const loadVoices = () => {
                const availableVoices = synthRef.current.getVoices();
                setVoices(availableVoices);
                // Set a default voice if available (e.g., an English voice)
                const defaultVoice = availableVoices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google') || voice.default);
                if (defaultVoice) {
                    setSelectedVoice(defaultVoice);
                } else if (availableVoices.length > 0) {
                    setSelectedVoice(availableVoices[0]); // Fallback to the first available voice
                }
            };

            // Voices might not be immediately available, so listen for the 'voiceschanged' event
            synthRef.current.onvoiceschanged = loadVoices;
            loadVoices(); // Call initially in case voices are already loaded
        } else {
            setError(prev => prev + " Speech Synthesis API not supported in this browser.");
        }

        // Cleanup function for useEffect
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
            }
            if (synthRef.current) {
                synthRef.current.onvoiceschanged = null;
            }
        };
    }, []);

    // Function to handle voice output (Text-to-Speech)
    const speak = (text) => {
        if (synthRef.current && text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = outputLanguage === 'am' ? 'am-ET' : 'en-US'; // Set language based on selection
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            } else {
                // Try to find a voice matching the selected output language if no specific voice is chosen
                const langVoice = voices.find(voice => voice.lang.startsWith(outputLanguage));
                if (langVoice) {
                    utterance.voice = langVoice;
                }
            }
            synthRef.current.speak(utterance);
        }
    };

    // Function to start speech recognition
    const startListening = () => {
        if (recognitionRef.current) {
            setListening(true);
            setError(''); // Clear previous errors
            try {
                recognitionRef.current.start();
            } catch (e) {
                setError(`Error starting speech recognition: ${e.message}`);
                console.error("Error starting speech recognition:", e);
                setListening(false);
            }
        } else {
            setError("Speech Recognition is not ready or supported.");
        }
    };

    // Function to handle image file selection
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Remove the "data:image/png;base64," prefix for the API call, keep it for preview
                const base64String = reader.result;
                setImageData(base64String.split(',')[1]); // Store only the base64 part
                setImagePreview(base64String); // Store full string for preview
            };
            reader.onerror = (error) => {
                setError("Error reading file: " + error.target.error.name);
                setImageData(null);
                setImagePreview(null);
            };
            reader.readAsDataURL(file);
        } else {
            setImageData(null);
            setImagePreview(null);
        }
    };

    // Function to handle sending the query to the AI agent
    const handleSendQuery = async (inputQuery = query) => {
        if (!inputQuery.trim() && !imageData) {
            setError("Please enter a query or speak into the microphone, or upload an image.");
            return;
        }

        setLoading(true);
        setError('');
        setResponse('');
        setBusinessInfo('');

        try {
            // Prepare chat history for the LLM
            let chatHistoryParts = [];
            // Instruct the AI to respond in the selected language and to include image URLs
            const languageInstruction = outputLanguage === 'am' ? 'Respond in Amharic.' : 'Respond in English.';
            const imageInstruction = 'For each business, provide a placeholder image URL (e.g., https://placehold.co/150x100/6A0DAD/FFFFFF?text=BizName) in the "imageUrl" field.';

            if (inputQuery.trim()) {
                chatHistoryParts.push({ text: `${inputQuery} in Addis Ababa. ${languageInstruction} ${imageInstruction}` });
            } else {
                chatHistoryParts.push({ text: `Provide information about this image in Addis Ababa. ${languageInstruction} ${imageInstruction}` });
            }

            if (imageData) {
                chatHistoryParts.push({
                    inlineData: {
                        mimeType: "image/png", // Assuming PNG, adjust if needed for other types
                        data: imageData
                    }
                });
            }

            const payload = {
                contents: [{ role: "user", parts: chatHistoryParts }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "agentResponse": { "type": "STRING" },
                            "businessDetails": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "name": { "type": "STRING" },
                                        "category": { "type": "STRING" },
                                        "address": { "type": "STRING" },
                                        "phone": { "type": "STRING" },
                                        "rating": { "type": "NUMBER" },
                                        "description": { "type": "STRING" }, // This description will be in the selected language
                                        "imageUrl": { "type": "STRING" } // Added imageUrl property
                                    },
                                    "required": ["name", "category", "address"]
                                }
                            }
                        }
                    }
                }
            };

            // Important: Replace 'YOUR_GEMINI_API_KEY' with your actual Google Gemini API Key
            // Get your API key from Google AI Studio (ai.google.dev)
            process.env.REACT_APP_GEMINI_API_KEY
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`API error: ${res.status} - ${errorData.error.message || 'Unknown error'}`);
            }

            const result = await res.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonText = result.candidates[0].content.parts[0].text;
                let parsedJson;
                try {
                    parsedJson = JSON.parse(jsonText);
                } catch (parseError) {
                    throw new Error(`Failed to parse JSON response from AI: ${parseError.message}. Raw response: ${jsonText}`);
                }

                const agentResponse = parsedJson.agentResponse || "I couldn't find specific details, but I can tell you more about similar businesses.";
                const details = parsedJson.businessDetails || [];

                setResponse(agentResponse);
                speak(agentResponse); // Speak the agent's response

                if (details.length > 0) {
                    const info = details.map(business => `
                        <div class="flex items-center mb-4 p-3 bg-white bg-opacity-5 rounded-lg shadow-sm">
                            <img src="${business.imageUrl || `https://placehold.co/80x80/6A0DAD/FFFFFF?text=${encodeURIComponent(business.name || 'Biz')}`}"
                                 alt="${business.name || 'Business'} Image"
                                 onerror="this.onerror=null;this.src='https://placehold.co/80x80/6A0DAD/FFFFFF?text=Image+Error';"
                                 class="w-20 h-20 rounded-md mr-4 object-cover"/>
                            <div>
                                <strong>${business.name}</strong> (${business.category})<br/>
                                Address: ${business.address}<br/>
                                Phone: ${business.phone || 'N/A'}<br/>
                                Rating: ${business.rating ? business.rating.toFixed(1) + '/5' : 'N/A'}<br/>
                                Description: ${business.description || 'No description available.'}
                            </div>
                        </div>
                    `).join('');
                    setBusinessInfo(info);
                } else {
                    setBusinessInfo('No specific business details found for your query. The AI might provide a general answer.');
                }

            } else {
                setResponse("I'm sorry, I couldn't generate a response based on your query. Please try again.");
                speak("I'm sorry, I couldn't generate a response based on your query. Please try again.");
                setBusinessInfo('');
            }
        } catch (err) {
            console.error("Error communicating with AI:", err);
            setError(`Failed to get a response from the AI: ${err.message}.`);
            setResponse("I encountered an error trying to process your request. Please try again later.");
            speak("I encountered an error trying to process your request. Please try again later.");
            setBusinessInfo('');
        } finally {
            setLoading(false);
            // Clear image data after sending the query
            setImageData(null);
            setImagePreview(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 text-white font-inter flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                `}
            </style>

            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 w-full max-w-2xl border border-white border-opacity-30">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 drop-shadow-lg">AI Business Agent</h1>

                <div className="mb-6">
                    <textarea
                        className="w-full p-4 rounded-xl bg-white bg-opacity-10 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none transition-all duration-300 shadow-inner"
                        rows="3"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type your query here, e.g., 'Find coffee shops near me' or 'What's a good restaurant in downtown?'"
                        disabled={loading || listening}
                    ></textarea>
                </div>

                <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                    <label htmlFor="image-upload" className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                        Upload Image
                    </label>
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading || listening}
                    />
                    {imagePreview && (
                        <div className="mt-4 sm:mt-0 sm:ml-4 p-2 bg-white bg-opacity-10 rounded-xl shadow-inner">
                            <img src={imagePreview} alt="Image Preview" className="max-w-full h-24 object-contain rounded-lg" />
                        </div>
                    )}
                </div>

                {voices.length > 0 && (
                    <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                        <label htmlFor="voice-select" className="text-white font-semibold">Agent Voice:</label>
                        <select
                            id="voice-select"
                            className="w-full sm:w-auto p-3 rounded-xl bg-white bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 shadow-inner"
                            value={selectedVoice ? selectedVoice.name : ''}
                            onChange={(e) => {
                                const voice = voices.find(v => v.name === e.target.value);
                                setSelectedVoice(voice);
                            }}
                            disabled={loading || listening}
                        >
                            {voices.map(voice => (
                                <option key={voice.name} value={voice.name} className="bg-gray-800 text-white">
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
                    <label htmlFor="output-language-select" className="text-white font-semibold">Output Language:</label>
                    <select
                        id="output-language-select"
                        className="w-full sm:w-auto p-3 rounded-xl bg-white bg-opacity-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 shadow-inner"
                        value={outputLanguage}
                        onChange={(e) => setOutputLanguage(e.target.value)}
                        disabled={loading || listening}
                    >
                        <option value="en" className="bg-gray-800 text-white">English</option>
                        <option value="am" className="bg-gray-800 text-white">Amharic</option>
                    </select>
                </div>


                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
                    <button
                        onClick={startListening}
                        className={`flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                            listening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-green-500 hover:bg-green-600'
                        } shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300`}
                        disabled={loading}
                    >
                        {listening ? (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                Listening...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                Start Listening
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleSendQuery()}
                        className={`flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        } shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300`}
                        disabled={loading || listening}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l.649-.187A8.134 8.134 0 0015 15.174V14a1 1 0 100-2h-3.325A4 4 0 007 8V4a1 1 0 00-1-1h-.089a1 1 0 00-.775 1.409l.649-.187A8.134 8.134 0 0015 15.174V14a1 1 0 100-2h-3.325A4 4 0 007 8V4a1 1 0 00-1-1h-.089a1 1 0 00-.775 1.409z"></path></svg>
                                Send Query
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-600 rounded-xl mb-4 text-sm text-center shadow-md">
                        {error}
                    </div>
                )}

                {response && (
                    <div className="bg-white bg-opacity-10 p-5 rounded-xl mb-4 shadow-inner">
                        <h2 className="text-xl font-semibold mb-2">Agent Response:</h2>
                        <p className="text-gray-100">{response}</p>
                    </div>
                )}

                {businessInfo && (
                    <div className="bg-white bg-opacity-10 p-5 rounded-xl shadow-inner overflow-auto max-h-64">
                        <h2 className="text-xl font-semibold mb-2">Business Information:</h2>
                        <div className="text-gray-100" dangerouslySetInnerHTML={{ __html: businessInfo }}></div>
                    </div>
                )}
            </div>
            <p className="mt-8 text-sm text-gray-200">
                This is a demo. Business information is simulated by AI.
            </p>
        </div>
    );
};

export default App;