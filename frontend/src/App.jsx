import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Footer from './components/footer/footer.jsx'
import Cursor from './components/cursor/cursor.jsx'
import './App.css'
import Nav from './components/navbar/Nav.jsx'
import Home from './page2/Home/Home.jsx'
import Preloader from './page2/preloader/preloader.jsx';
import teacherBg from './page2/teacher/homeBg.png';
import { LoadingProvider, useLoading } from './page2/preloader/LoadingContext.jsx';
import { AnimatePresence } from 'framer-motion';
const Itinerary = lazy(() => import('./components/itinerary/itinerary.jsx'));
const About = lazy(() => import('./page2/about/about.jsx'));
const Events = lazy(() => import('./page2/events/event.jsx'));
const Teams = lazy(() => import('./components/teams/teams.jsx'));
const Login = lazy(() => import('./components/login/login.jsx'));
const TeacherLogin = lazy(() => import('./page2/teacher/login.jsx'));
const Dashboard = lazy(() => import('./page2/teacher/dashboard.jsx'));
const DomeGallery = lazy(() => import('./page2/gallery/DomeGallery.jsx'));

// Import the Coming Soon component
import ComingSoonExact from './comingsoon/ComingSoonExact.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const myImages = Array.from({ length: 27 }, (_, i) => ({
  src: `/gallery/${i + 1}.webp`,
  alt: `Gallery image ${i + 1}`
}));



const TeacherLayout = () => {
  return (
    <div 
      className="teacher-panel-wrapper" 
      style={{ 
        minHeight: '100vh', 
        position: 'relative',
        backgroundImage: `url(${teacherBg})`, // Use the imported reference
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', 
        zIndex: 0,
      }}
    >
      <Outlet />
    </div>
  );
};

const AppContent = () => {
  const { isLoading } = useLoading(); 
  const location = useLocation(); // Now this will work!
  
  const targetTime = new Date("2026-02-03T15:30:00").getTime();
  const [isLive, setIsLive] = useState(Date.now() >= targetTime);

  useEffect(() => {
    if (isLive) return;
    const timer = setInterval(() => {
      if (Date.now() >= targetTime) {
        setIsLive(true);
        clearInterval(timer); 
      }
    }, 30000);
    return () => clearInterval(timer); 
  }, [isLive, targetTime]);

  const isTeacherPath = location.pathname.startsWith("/teacher");

  if (!isLive) return <ComingSoonExact />;

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <Preloader key="preloader" />}
      </AnimatePresence>

      {!isLoading && (
        <div className="main-content">
          {!isTeacherPath && <Nav />}
          
          <Cursor />
          <ScrollToTop />
          
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/events" element={<Events />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/gallery" element={
                  <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
                    <DomeGallery 
                      images={myImages}      
                      segments={35}      
                      fit={0.45}             
                      minRadius={400}        
                      imageBorderRadius="12px" 
                    />
                  </div>
                } 
              />
              <Route path="/itinerary" element={<Itinerary />} />
              
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route path="login" element={<TeacherLogin />} />
                <Route path="dashboard" element={<Dashboard />} />
              </Route>
            </Routes>
          </Suspense>

          {!isTeacherPath && <Footer />}
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <Router>
      <LoadingProvider>
        <AppContent />
      </LoadingProvider>
    </Router>
  );
}

export default App;
