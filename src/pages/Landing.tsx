import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Landing.module.css';
import { CheckCircle, Zap, Shield, Smartphone, ArrowRight, LayoutDashboard, FileText, Users } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // You can replace these with actual screenshots of the app later!
  const slides = [
    {
      url: 'https://images.unsplash.com/photo-1554774853-719586f82d77?auto=format&fit=crop&q=80&w=1600',
      alt: 'Dashboard Overview'
    },
    {
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600',
      alt: 'Invoice Generation'
    },
    {
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600',
      alt: 'Data Analytics'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className={styles.landingContainer}>
      
      {/* Navbar */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/logo.jpg" alt="Billora Logo" />
          Billora
        </div>
        <nav className={styles.navLinks}>
          <a href="#about">About</a>
          <a href="#how-to-use">How to Use</a>
          <a href="#why-to-use">Why Choose Us</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className={styles.authButtons}>
          {user ? (
            <button className={styles.btnPrimary} onClick={() => navigate('/app')}>
              Go to Dashboard <ArrowRight size={16} style={{display: 'inline', verticalAlign: 'middle', marginLeft: '4px'}}/>
            </button>
          ) : (
            <>
              <button className={styles.btnOutline} onClick={() => navigate('/login')}>Login</button>
              <button className={styles.btnPrimary} onClick={() => navigate('/register')}>Sign Up Free</button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Smart Billing for<br/>
          <span>Modern Businesses</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Billora is the ultimate invoice and billing software. Create professional GST-ready bills, manage your customers, and track your business growth all in one place.
        </p>
        <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
          <button className={styles.btnPrimary} style={{fontSize: '1.1rem', padding: '1rem 2rem'}} onClick={() => navigate(user ? '/app' : '/register')}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Interactive Carousel Preview */}
      <section className={styles.carouselSection}>
        <div className={styles.carouselContainer}>
          {slides.map((slide, index) => (
            <div key={index} className={`${styles.slide} ${currentSlide === index ? styles.active : ''}`}>
              <img src={slide.url} alt={slide.alt} />
            </div>
          ))}
          <div className={styles.carouselControls}>
            {slides.map((_, index) => (
              <button 
                key={index} 
                className={`${styles.dot} ${currentSlide === index ? styles.active : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={styles.about}>
        <h2 className={styles.sectionTitle}>About Billora</h2>
        <p className={styles.aboutText}>
          Billora was built from the ground up to solve the headaches of manual billing. Whether you're running an electrical shop, a retail store, or a wholesale business, Billora adapts to your workflow. We believe that generating an invoice shouldn't take more than 30 seconds. That's why we focus on speed, offline capabilities, and a beautifully simple user interface.
        </p>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" style={{padding: '5rem 5%', background: 'white'}}>
        <h2 className={styles.sectionTitle} style={{textAlign: 'center', marginBottom: '3rem'}}>How to Use Billora</h2>
        <div className={styles.featuresGrid} style={{padding: 0}}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Users size={32} /></div>
            <h3>1. Add Customers & Products</h3>
            <p>Easily import or manually add your customer details and product catalog with pricing.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><FileText size={32} /></div>
            <h3>2. Generate Invoice</h3>
            <p>Select your customer, pick the products, apply taxes/discounts, and hit save. It's that simple.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><LayoutDashboard size={32} /></div>
            <h3>3. Print & Track</h3>
            <p>Print the professional PDF receipt instantly and track your daily sales on your Dashboard.</p>
          </div>
        </div>
      </section>

      {/* Why to Use Section */}
      <section id="why-to-use" style={{padding: '5rem 5%', background: '#f8fafc'}}>
        <h2 className={styles.sectionTitle} style={{textAlign: 'center', marginBottom: '3rem'}}>Why Choose Us?</h2>
        <div className={styles.featuresGrid} style={{padding: 0}}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Zap size={32} /></div>
            <h3>Lightning Fast</h3>
            <p>Built with offline caching. Even if your internet drops, you can still view your invoices.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Smartphone size={32} /></div>
            <h3>Mobile Responsive</h3>
            <p>Access your billing software from your phone, tablet, or desktop anywhere, anytime.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Shield size={32} /></div>
            <h3>Secure & Safe</h3>
            <p>Your data is securely backed up to the cloud automatically. Never lose a bill again.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing}>
        <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
        <p style={{color: '#64748b', fontSize: '1.1rem'}}>Choose the plan that fits your business needs.</p>
        
        <div className={styles.pricingGrid}>
          
          {/* 6 Months Plan */}
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Semi-Annual</h3>
            <div className={styles.planPrice}>₹500</div>
            <div className={styles.planDuration}>for 6 months</div>
            <ul className={styles.planFeatures}>
              <li><CheckCircle size={20} /> Unlimited Invoices</li>
              <li><CheckCircle size={20} /> Unlimited Customers</li>
              <li><CheckCircle size={20} /> PDF Generation</li>
              <li><CheckCircle size={20} /> Cloud Backup</li>
            </ul>
            <button className={styles.btnOutline} style={{width: '100%'}} onClick={() => navigate('/register')}>Get Started</button>
          </div>

          {/* 1 Year Plan (Popular) */}
          <div className={`${styles.pricingCard} ${styles.popular}`}>
            <div className={styles.popularBadge}>MOST POPULAR</div>
            <h3 className={styles.planName}>Annual</h3>
            <div className={styles.planPrice}>₹1,000</div>
            <div className={styles.planDuration}>for 12 months</div>
            <ul className={styles.planFeatures}>
              <li><CheckCircle size={20} /> Unlimited Invoices</li>
              <li><CheckCircle size={20} /> Unlimited Customers</li>
              <li><CheckCircle size={20} /> PDF Generation</li>
              <li><CheckCircle size={20} /> Cloud Backup</li>
              <li><CheckCircle size={20} /> Priority Support</li>
            </ul>
            <button className={styles.btnPrimary} style={{width: '100%'}} onClick={() => navigate('/register')}>Get Started</button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 'bold', color: 'white'}}>
          <img src="/logo.jpg" alt="Logo" style={{height: '24px', borderRadius: '4px'}} />
          Billora
        </div>
        <p>© 2026 Billora Billing Software. All rights reserved.</p>
      </footer>

    </div>
  );
}
