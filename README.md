
# AI Business Agent

This is an AI-powered business search agent for Addis Ababa, built with React and Google Gemini 2.0 Flash API. It allows users to query for businesses using text or images, and get detailed information including a simulated image. The agent supports multiple output languages and voice responses.

## Features

- **Text and Image Input:** Ask questions using text or upload an image to find businesses.
- **AI-Powered Responses:** Utilizes Google Gemini 2.0 Flash to process queries and provide structured business details.
- **Multi-language Output:** Choose between English and Amharic for AI responses and voice output.
- **Voice Input & Output:** Speak your queries and listen to the agent's responses.
- **Simulated Business Details:** Get mock business names, categories, addresses, phone numbers, ratings, descriptions, and placeholder images.

## Setup and Installation

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- Node.js (v14 or higher recommended) and npm (comes with Node.js) installed on your system.
- A Google Gemini API Key. You can get one from [Google AI Studio](https://ai.google.dev/).

### Steps

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/ai-business-agent.git](https://github.com/YOUR_USERNAME/ai-business-agent.git)
    cd ai-business-agent
    ```
    (Replace `YOUR_USERNAME` with your GitHub username after you create the repo)

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure your Google Gemini API Key:**
    Open `src/App.js`. Find the line:
    ```javascript
    const apiKey = "YOUR_GEMINI_API_KEY";
    ```
    Replace `"YOUR_GEMINI_API_KEY"` with your actual API key obtained from Google AI Studio. **Do not commit your API key directly to public repositories.** For a more secure approach in a real application, you would use environment variables. For this demo, direct insertion is shown for simplicity.

4.  **Run the application:**
    ```bash
    npm start
    ```
    This will start the development server, and your application will typically open in your browser at `http://localhost:3000`.

## Usage

1.  **Type your query** in the text area.
2.  **Upload an image** using the "Upload Image" button (optional).
3.  **Select your desired output language** (English or Amharic).
4.  **Choose an Agent Voice** (if available on your system).
5.  Click "Send Query" or "Start Listening" (to speak your query).
6.  The agent will process your request and display simulated business information.

## Technologies Used

-   **React.js**: Front-end JavaScript library for building user interfaces.
-   **Tailwind CSS**: A utility-first CSS framework for rapid UI development (via CDN).
-   **Web Speech API**: For voice input (SpeechRecognition) and voice output (SpeechSynthesis).
-   **Google Gemini 2.0 Flash API**: For intelligent natural language processing and structured data generation.

## Contributing

Feel free to fork this repository, make improvements, and submit pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).