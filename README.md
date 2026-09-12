💅 AI Nail Studio — Virtual Nail Art & Salon Visualizer

An AI-driven virtual nail salon and try-on application built with React, TypeScript, Tailwind CSS, and Google Gemini AI. It enables users to visualize custom nail polish colors, salon shapes, realistic surface textures, and intricate nail art directly on photos of their own hands.

───

✨ Features

• 🎯 Automated Nail Plate Detection: Uses Gemini Vision models with fallback resilience to accurately identify nail contours and lateral grooves.
• 💅 Salon Shape Sculpting: Transform natural nails into popular salon shapes including: 
◦ Almond
◦ Square
◦ Squoval
◦ Coffin / Ballerina
◦ Stiletto
◦ Oval & Round
◦ Adjustable extension length and cuticle micro-alignment
• 🎨 Realistic 3D Shaders & Finishes: 
◦ Ultra-Glossy Top Coat: Natural light highlights and dome curvature specular reflections
◦ Velvet Matte: Soft diffused scattering with light micro-texture
◦ Glitter & Sparkle: Multi-faceted sparkling flecks
◦ Mirror Chrome & Pearl: Metallic gradient sheen
◦ Magnetic Cat-Eye: 3D iridescent light strip with adjustable magnetic angle
◦ Translucent Jelly / Syrup: High-depth glass gel effect
• 🛡️ Anti-Overflow & Snug Fit Control: Mathematically constrained quadratic bezier pathing ensures polish stays strictly on the nail plate without bleeding onto cuticles or lateral skin folds.
• 🖐️ Accent Nail & Per-Finger Customization: Customize accent fingers (Ring, Index, Thumb) with distinct designs or colors.
• 📷 Live Camera & Photo Upload: Upload high-resolution hand photos or capture live using your smartphone/webcam.

───

🛠️ Tech Stack

• Frontend: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion
• Rendering Engine: HTML5 2D Canvas with custom specular & fresnel illumination algorithms
• Backend API: Node.js, Express, tsx, esbuild
• AI / Computer Vision: @google/genai (Gemini 3.8 / 3.6 / 3.1 Flash cascade)
• Build Tool: Vite 6

───

🚀 Quick Start

1. Clone the repository
bash
git clone https://github.com/YOUR_USERNAME/ai-nail-studio.git
cd ai-nail-studio




