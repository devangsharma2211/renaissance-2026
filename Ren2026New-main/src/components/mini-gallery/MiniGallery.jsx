import "./MiniGallery.css";

import { getAsset } from '../../config'; // Adjust the number of '../' if needed

const MiniGallery = () => {
  const gallery = [
    { img: getAsset("/mini-gallery/1.webp"), title: "DJ NIGHT" },
    { img: getAsset("/mini-gallery/2.webp"), title: "DANCE" },
    { img: getAsset("/mini-gallery/3.webp"), title: "SINGING" },
    { img: getAsset("/mini-gallery/4.webp"), title: "FASHION" },
    { img: getAsset("/mini-gallery/5.webp"), title: "LIVE MUSIC" },
    { img: "https://ren2026-assests.b-cdn.net/img17.webp", title: "TECH EVENTS" }
  ];

  const bgImage = getAsset("/mini-gallery/bg5.webp");

  return (
    // <div className="gallery-wrapper " style={{ 
    //     position: 'relative', 
    //     display: 'flex',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     width: '100%', 
    //     // CHANGED: 'fit-content' makes the section height adapt to the grid exact size
    //     height: 'fit-content', 
    //     minHeight: '180vh', 
    //     overflow: 'visible', 
    //     zIndex: 20          
    // }}>
    <div className="gallery-wrapper ">
      
      {/* Background Layer */}
      <div style={{
         position: 'absolute',
         inset: 0,
         backgroundImage: `url(${bgImage})`,
         backgroundSize: 'cover', 
         backgroundPosition: 'center',
         backgroundRepeat: 'no-repeat',
         zIndex: -1 
      }} />

      {/* Cards Container */}
      <div className="container" 
           
      >
        {gallery.map((item, index) => (
          <div className="card" key={index}>
            <img src={item.img} alt={item.title} loading="lazy" decoding="async" />
            <div className="card__head">{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniGallery;
