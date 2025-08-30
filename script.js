/**
 * PokiFace - Pokémon Face Matching App
 * Uses Gemini AI to analyze faces and find matching Pokémon
 */

class PokiFaceApp {
    constructor() {
        // App state
        this.apiKey = null;
        this.currentImageFile = null;
        this.isAnalyzing = false;
        
        // DOM elements
        this.elements = {};
        
        // Initialize app
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.showApiModal();
    }
    
    /**
     * Cache all DOM elements for better performance
     */
    cacheDOMElements() {
        this.elements = {
            // Modal elements
            apiModal: document.getElementById('apiModal'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            togglePassword: document.getElementById('togglePassword'),
            saveApiKey: document.getElementById('saveApiKey'),
            settingsBtn: document.getElementById('settingsBtn'),
            
            // Upload elements
            uploadSection: document.getElementById('uploadSection'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            browseBtn: document.getElementById('browseBtn'),
            
            // Comparison elements
            comparisonSection: document.getElementById('comparisonSection'),
            userImage: document.getElementById('userImage'),
            pokemonContainer: document.getElementById('pokemonContainer'),
            pokemonImage: document.getElementById('pokemonImage'),
            pokemonName: document.getElementById('pokemonName'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            
            // Result elements
            resultDescription: document.getElementById('resultDescription'),
            pokemonDescription: document.getElementById('pokemonDescription'),
            shareBtn: document.getElementById('shareBtn'),
            tryAgainBtn: document.getElementById('tryAgainBtn'),
            
            // Toast elements
            errorToast: document.getElementById('errorToast'),
            successToast: document.getElementById('successToast'),
            errorMessage: document.getElementById('errorMessage'),
            successMessage: document.getElementById('successMessage'),
            closeToast: document.getElementById('closeToast'),
            closeSuccessToast: document.getElementById('closeSuccessToast')
        };
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // API Modal events
        this.elements.saveApiKey.addEventListener('click', () => this.saveApiKey());
        this.elements.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        this.elements.settingsBtn.addEventListener('click', () => this.showApiModal());
        this.elements.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });
        
        // File upload events
        this.elements.uploadArea.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.fileInput.click();
        });
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Action button events
        this.elements.shareBtn.addEventListener('click', () => this.shareResult());
        this.elements.tryAgainBtn.addEventListener('click', () => this.resetApp());
        
        // Toast close events
        this.elements.closeToast.addEventListener('click', () => this.hideToast('error'));
        this.elements.closeSuccessToast.addEventListener('click', () => this.hideToast('success'));
    }
    
    /**
     * Show the API key modal
     */
    showApiModal() {
        this.elements.apiModal.classList.remove('hidden');
        this.elements.apiKeyInput.focus();
        
        // Pre-fill if API key exists in localStorage
        const savedApiKey = localStorage.getItem('gemini-api-key');
        if (savedApiKey) {
            this.elements.apiKeyInput.value = savedApiKey;
        }
    }
    
    /**
     * Hide the API key modal
     */
    hideApiModal() {
        this.elements.apiModal.classList.add('hidden');
    }
    
    /**
     * Toggle password visibility in API key input
     */
    togglePasswordVisibility() {
        const input = this.elements.apiKeyInput;
        const icon = this.elements.togglePassword.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    /**
     * Save the API key and validate it
     */
    async saveApiKey() {
        const apiKey = this.elements.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showToast('error', 'Please enter your Gemini API key');
            return;
        }
        
        // Save to localStorage and app state
        localStorage.setItem('gemini-api-key', apiKey);
        this.apiKey = apiKey;
        
        // Validate API key by making a test request
        this.elements.saveApiKey.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
        this.elements.saveApiKey.disabled = true;
        
        try {
            await this.validateApiKey(apiKey);
            this.hideApiModal();
            this.showToast('success', 'API key saved successfully!');
        } catch (error) {
            this.showToast('error', 'Invalid API key. Please check and try again.');
            localStorage.removeItem('gemini-api-key');
            this.apiKey = null;
        } finally {
            this.elements.saveApiKey.innerHTML = '<i class="fas fa-rocket"></i> Let\'s Go!';
            this.elements.saveApiKey.disabled = false;
        }
    }
    
    /**
     * Validate API key by making a test request to Gemini
     */
    async validateApiKey(apiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Hello"
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error('Invalid API key');
        }
    }
    
    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.add('dragover');
    }
    
    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
    }
    
    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    /**
     * Handle file selection from input
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }
    
    /**
     * Process the selected file
     */
    processFile(file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            this.showToast('error', 'Please upload a JPG or PNG image file');
            return;
        }
        
        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast('error', 'Image size should be less than 10MB');
            return;
        }
        
        this.currentImageFile = file;
        this.displayUserImage(file);
        this.analyzeFace();
    }
    
    /**
     * Display the user's uploaded image
     */
    displayUserImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.elements.userImage.src = e.target.result;
            this.showComparisonSection();
        };
        reader.readAsDataURL(file);
    }
    
    /**
     * Show the comparison section with animation
     */
    showComparisonSection() {
        this.elements.uploadSection.style.display = 'none';
        this.elements.comparisonSection.style.display = 'block';
        
        // Trigger animation
        setTimeout(() => {
            this.elements.comparisonSection.classList.add('show');
        }, 50);
    }
    
    /**
     * Analyze the face using Gemini AI
     */
    async analyzeFace() {
        if (!this.apiKey) {
            this.showToast('error', 'Please set your API key first');
            this.showApiModal();
            return;
        }
        
        if (!this.currentImageFile) {
            this.showToast('error', 'Please upload an image first');
            return;
        }
        
        this.isAnalyzing = true;
        this.showLoadingState();
        
        try {
            // Convert image to base64
            const base64Image = await this.fileToBase64(this.currentImageFile);
            
            // Analyze with Gemini
            const result = await this.callGeminiAPI(base64Image);
            
            // Display result
            await this.displayResult(result);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast('error', 'Failed to analyze image. Please try again.');
            this.hideLoadingState();
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Remove data URL prefix to get just the base64 data
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Call Gemini API to analyze the face
     */
    async callGeminiAPI(base64Image) {
        const prompt = `You are a Pokémon expert analyzing faces to find unique matches. Look at this person's face and determine which specific Pokémon they most resemble. 

IMPORTANT: Always give DIFFERENT and VARIED Pokémon matches - never repeat the same Pokémon. Consider these diverse categories:
- Cute Pokémon (Pikachu, Eevee, Jigglypuff, Togepi, Mew)
- Strong Pokémon (Charizard, Blastoise, Machamp, Alakazam)
- Unique Pokémon (Psyduck, Snorlax, Meowth, Gengar, Squirtle)
- Legendary Pokémon (Mew, Celebi, Jirachi)
- Others (Bulbasaur, Charmander, Pichu, Raichu, etc.)

Analyze these facial features:
1. Face shape (round, oval, square, heart-shaped)
2. Eyes (size, shape, expression - friendly, mischievous, wise, etc.)
3. Overall expression and personality vibe
4. Any distinctive features

Based on the analysis, pick a SPECIFIC Pokémon that matches their features and personality.

Respond with ONLY this JSON format (no markdown, no extra text):
{
  "pokemon_name": "Specific Pokemon Name",
  "description": "You're like [Pokemon Name] - [2-3 engaging sentences explaining the match based on their facial features and personality traits]"
}

Remember: Give a UNIQUE match each time, never default to the same Pokémon!`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: prompt
                        },
                        {
                            inline_data: {
                                mime_type: this.currentImageFile.type,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        console.log('Raw API response:', text); // Debug log
        
        try {
            // Clean the response text
            let cleanText = text.trim();
            
            // Remove markdown code blocks if present
            cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Remove any extra text before/after JSON
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanText = jsonMatch[0];
            }
            
            // Parse the JSON response
            const result = JSON.parse(cleanText);
            
            // Validate the result has required fields
            if (!result.pokemon_name || !result.description) {
                throw new Error('Invalid response format');
            }
            
            return result;
        } catch (parseError) {
            console.warn('Failed to parse JSON:', parseError, 'Raw text:', text);
            
            // Better fallback with variety
            const fallbackPokemon = [
                {
                    pokemon_name: "Pikachu",
                    description: "You're like Pikachu - energetic and friendly! Your bright eyes and cheerful expression show an electric personality that lights up any room."
                },
                {
                    pokemon_name: "Eevee", 
                    description: "You're like Eevee - adaptable and charming! Your versatile features suggest someone who can fit into any situation with grace and style."
                },
                {
                    pokemon_name: "Snorlax",
                    description: "You're like Snorlax - calm and dependable! Your relaxed expression and gentle features show someone who brings peace and comfort to others."
                },
                {
                    pokemon_name: "Psyduck",
                    description: "You're like Psyduck - thoughtful and unique! Your expressive eyes suggest a deep thinker who sees the world in interesting ways."
                },
                {
                    pokemon_name: "Jigglypuff",
                    description: "You're like Jigglypuff - sweet and endearing! Your soft features and gentle expression show someone who brings joy and melody to life."
                }
            ];
            
            // Return a random fallback
            return fallbackPokemon[Math.floor(Math.random() * fallbackPokemon.length)];
        }
    }
    
    /**
     * Display the analysis result
     */
    async displayResult(result) {
        try {
            // Get Pokémon image from PokeAPI
            const pokemonImage = await this.getPokemonImage(result.pokemon_name);
            
            // Update UI
            this.elements.pokemonName.textContent = result.pokemon_name;
            this.elements.pokemonImage.src = pokemonImage;
            this.elements.pokemonDescription.textContent = result.description;
            
            // Show result with animation
            this.hideLoadingState();
            
            setTimeout(() => {
                this.elements.pokemonImage.style.display = 'block';
                this.elements.resultDescription.style.display = 'block';
                
                setTimeout(() => {
                    this.elements.resultDescription.classList.add('show');
                }, 100);
            }, 500);
            
        } catch (error) {
            console.error('Display result error:', error);
            this.showToast('error', 'Failed to load Pokémon data');
            this.hideLoadingState();
        }
    }
    
    /**
     * Get Pokémon image from PokeAPI
     */
    async getPokemonImage(pokemonName) {
        try {
            // Clean up the Pokémon name for API call
            const cleanName = pokemonName.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
            
            if (!response.ok) {
                throw new Error('Pokémon not found');
            }
            
            const data = await response.json();
            
            // Prefer the official artwork, fallback to sprite
            return data.sprites.other['official-artwork'].front_default || 
                   data.sprites.front_default || 
                   'https://via.placeholder.com/200x200?text=Pokemon';
                   
        } catch (error) {
            console.warn(`Failed to fetch image for ${pokemonName}:`, error);
            // Return a placeholder image
            return 'https://via.placeholder.com/200x200?text=Pokemon';
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        this.elements.loadingSpinner.style.display = 'flex';
        this.elements.pokemonImage.style.display = 'none';
        this.elements.resultDescription.style.display = 'none';
        this.elements.resultDescription.classList.remove('show');
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.elements.loadingSpinner.style.display = 'none';
    }
    
    /**
     * Share the result
     */
    shareResult() {
        const pokemonName = this.elements.pokemonName.textContent;
        const description = this.elements.pokemonDescription.textContent;
        
        const shareText = `I just discovered my Pokémon twin on PokiFace! 🎭\n\nI'm ${pokemonName}! ${description}\n\nFind your Pokémon twin at: ${window.location.href}`;
        
        if (navigator.share) {
            // Use native sharing if available
            navigator.share({
                title: 'My Pokémon Twin - PokiFace',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }
    
    /**
     * Fallback sharing method
     */
    fallbackShare(text) {
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('success', 'Result copied to clipboard!');
            }).catch(() => {
                this.legacyShare(text);
            });
        } else {
            this.legacyShare(text);
        }
    }
    
    /**
     * Legacy sharing method for older browsers
     */
    legacyShare(text) {
        // Create a temporary textarea to copy text
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('success', 'Result copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            this.showToast('error', 'Failed to copy result');
        } finally {
            document.body.removeChild(textarea);
        }
    }
    
    /**
     * Reset the app to initial state
     */
    resetApp() {
        // Clear current state
        this.currentImageFile = null;
        this.isAnalyzing = false;
        
        // Reset UI
        this.elements.comparisonSection.classList.remove('show');
        
        setTimeout(() => {
            this.elements.comparisonSection.style.display = 'none';
            this.elements.uploadSection.style.display = 'block';
            this.elements.fileInput.value = '';
            
            // Reset result state
            this.elements.pokemonImage.style.display = 'none';
            this.elements.resultDescription.style.display = 'none';
            this.elements.resultDescription.classList.remove('show');
            this.hideLoadingState();
        }, 300);
    }
    
    /**
     * Show toast notification
     */
    showToast(type, message) {
        const toast = type === 'error' ? this.elements.errorToast : this.elements.successToast;
        const messageElement = type === 'error' ? this.elements.errorMessage : this.elements.successMessage;
        
        messageElement.textContent = message;
        toast.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideToast(type);
        }, 5000);
    }
    
    /**
     * Hide toast notification
     */
    hideToast(type) {
        const toast = type === 'error' ? this.elements.errorToast : this.elements.successToast;
        toast.classList.remove('show');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PokiFaceApp();
});

// Add some fun console messages
console.log(`
🎭 PokiFace - Pokémon Face Matching App
═══════════════════════════════════════

Welcome to PokiFace! 🚀
Find your Pokémon twin using AI magic!

Made with ❤️ and powered by:
🧠 Google Gemini AI
🐾 PokeAPI
✨ Modern web technologies

Enjoy discovering your Pokémon personality! 🌟
`);

// Add some global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
}); 