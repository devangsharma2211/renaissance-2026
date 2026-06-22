import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation,Outlet  } from 'react-router-dom';
import Cursor from './components/cursor/cursor.jsx'
import './App.css'
import ComingSoon from './page2/comingsoon/ComingSoon.jsx';
import { LoadingProvider } from './page2/teacher/LoadingContext.jsx';
// // Scroll to top component

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const TeacherLayout = () => {
  return (
    <LoadingProvider>
      <div 
        className="teacher-panel-wrapper" 
        style={{ 
          minHeight: '100vh', 
          position: 'relative',
          backgroundImage: 'url("/src/teacher/pages/space-1569133_1280.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed' 
        }}
      >
        <Outlet />
      </div>
    </LoadingProvider>
  );
};


function App() {

   // 1. Create an array of 27 images
  // This assumes you have images named 1.jpg, 2.jpg... up to 27.jpg in public/gallery/
  const myImages = Array.from({ length: 27 }, (_, i) => ({
    src: `/gallery/${i + 1}.webp`,
    alt: `Gallery image ${i + 1}`
  }));
  
  return (
      <Router>
         {/* <Nav />
      <Hero />
      <Celebs />
       */}
      {/* <About /> */}
      {/* <Footer /> */}
      {/* Navbar stays outside Routes so it appears on every page */}
      <Cursor />
      <Routes>
        {/* Allot the Home component to the root path */}
        <Route path="/" element={<ComingSoon />} />
        
        {/* Add more routes as needed */}
        {/* <Route path="/events" element={<Events />} /> */}        
      </Routes>
    </Router>
  )
}

export default App
 