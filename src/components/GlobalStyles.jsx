import React from 'react';

export const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    
    :root {
      --gold-primary: #C9A857;
      --gold-dark: #9e8036;
      --bg-dark: #1a1a1a;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-dark);
      background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://kwzejxqfkmagbrbrymgd.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_t6x1art6x1art6x1%20FUNDO%20ESCRITO%20A%20O.png');
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      background-repeat: no-repeat;
    }
    
    .font-serif { font-family: 'Playfair Display', serif; }
    
    .btn-gold {
      background: linear-gradient(90deg, #b89543 0%, #eecf7e 50%, #b89543 100%);
      color: #1a1a1a;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .btn-gold:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
  `}</style>
);
