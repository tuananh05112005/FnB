import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Khởi tạo AOS và hiệu ứng load
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      anchorPlacement: 'top-bottom',
    });
    
    const loadTimer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(loadTimer);
  }, []);
  
  // Xử lý scroll với useCallback để tối ưu
  const handleScroll = useCallback(() => {
    setScrollPosition(window.scrollY);
    AOS.refresh();
  }, []);
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Dữ liệu có thể tách ra thành file riêng nếu cần
  const categories = [
    { name: 'Cà phê', image: '/image/7.png' }, 
    { name: 'Trà', image: '/image/16.png' }, 
    { name: 'Sinh tố', image: '/image/1.png' }, 
    { name: 'Trà sữa', image: '/image/10.png' }
  ];
  
  const features = [
    { icon: '🌿', title: 'Nguyên liệu sạch', count: '100%' }, 
    { icon: '⭐', title: 'Chất lượng cao', count: '5.0' }, 
    { icon: '💯', title: 'Hương vị đặc biệt', count: '20+' }
  ];
  
  const testimonials = [
    { name: 'Nguyễn Văn A', comment: 'Thức uống tuyệt vời nhất mà tôi từng thử!', rating: 5 },
    { name: 'Trần Thị B', comment: 'Nguyên liệu sạch, hương vị đặc biệt.', rating: 5 },
    { name: 'Lê Văn C', comment: 'Phục vụ chuyên nghiệp, không gian thoải mái.', rating: 4 }
  ];
  
  const contacts = [
    { icon: '✉️', text: 'Email: contact@prdrink.com' }, 
    { icon: '📞', text: 'Điện thoại: 0123 456 789' }, 
    { icon: '🏠', text: 'Địa chỉ: 123 Đường ABC, Quận XYZ, TP. HCM' }
  ];
  
  const socials = [
    { icon: '📘', label: 'Facebook' }, 
    { icon: '📸', label: 'Instagram' }, 
    { icon: '▶️', label: 'YouTube' }
  ];

  return (
    <div className={`container-fluid p-0 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
         style={{ transition: 'opacity 0.8s ease-in-out' }}>
      
      {/* Banner với parallax tối ưu cho mobile */}
      <header 
        className="position-relative text-white text-center bg-dark" 
        style={{ 
          backgroundImage: "url('/image/banner.jpg')", 
          backgroundSize: 'cover', 
          backgroundAttachment: window.innerWidth > 768 ? 'fixed' : 'scroll',
          backgroundPosition: `center ${scrollPosition * 0.2}px`, 
          height: window.innerWidth > 768 ? '500px' : '400px',
          transition: 'all 0.3s ease-out' 
        }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50"></div>
        <div className="position-relative d-flex flex-column justify-content-center align-items-center h-100 px-3">
          <h1 
            className="fw-bold display-4 mb-3" 
            data-aos="zoom-in" 
            data-aos-duration="1000"
            style={{ fontSize: window.innerWidth < 768 ? '2rem' : '' }}
          >
            PRDrink - Thức uống hiện đại
          </h1>
          <p 
            className="lead mb-4" 
            data-aos="fade-up" 
            data-aos-delay="300" 
            data-aos-duration="800"
          >
            Trải nghiệm những hương vị tuyệt vời nhất
          </p>
          <Link 
            to="/products" 
            className="btn btn-warning btn-lg px-4 py-2" 
            data-aos="fade-up" 
            data-aos-delay="600"
          >
            Khám phá ngay
          </Link>
        </div>
      </header>

      {/* Danh mục sản phẩm responsive */}
      <section className="container my-5 px-3 px-md-0">
        <h2 className="text-center text-warning mb-4" data-aos="fade-up">
          Danh mục nổi bật
        </h2>
        <div className="row g-4 justify-content-center">
          {categories.map((product, index) => (
            <div 
              key={index} 
              className="col-sm-6 col-md-4 col-lg-3" 
              data-aos="fade-up" 
              data-aos-delay={index * 100}
            >
              <div 
                className="card shadow-sm border-0 h-100 product-card"
                style={{ 
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  overflow: 'hidden'
                }}
              >
                <div className="overflow-hidden" style={{ height: '200px' }}>
                  <img 
                    src={product.image} 
                    className="card-img-top h-100 object-fit-cover" 
                    alt={product.name}
                    loading="lazy"
                  />
                </div>
                <div className="card-body text-center d-flex flex-column">
                  <h5 className="card-title">{product.name}</h5>
                  <Link 
                    to="/products" 
                    className="btn btn-outline-warning mt-auto"
                  >
                    Xem thêm
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Giới thiệu với layout responsive */}
      <section className="py-5 text-center bg-light">
        <div className="container" data-aos="fade-up">
          <h2 className="text-warning mb-4">Về PRDrink</h2>
          <p className="lead px-2" data-aos="fade-up" data-aos-delay="200">
            PRDrink mang đến cho bạn những thức uống thơm ngon, chất lượng nhất.
          </p>
          <div className="row mt-4 justify-content-center">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="col-sm-6 col-md-4 mb-4"
                data-aos="zoom-in" 
                data-aos-delay={300 + (index * 100)}
              >
                <div className="card border-0 shadow-sm p-3 h-100 feature-card">
                  <h3 className="display-4 mb-3">{feature.icon}</h3>
                  <h4 className="text-warning">{feature.count}</h4>
                  <h5 className="mb-0">{feature.title}</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Đánh giá khách hàng - Carousel có thể thêm nếu cần */}
      <section className="container my-5 px-3 px-md-0">
        <h2 className="text-center text-warning mb-4" data-aos="fade-up">
          Khách hàng nói gì về chúng tôi
        </h2>
        <div className="row g-4 justify-content-center">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="col-md-6 col-lg-4" 
              data-aos="fade-up" 
              data-aos-delay={index * 150}
            >
              <div className="card shadow border-0 h-100 p-3 testimonial-card">
                <div className="d-flex justify-content-between mb-3">
                  <h5 className="card-title mb-0">{testimonial.name}</h5>
                  <div>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-warning">★</span>
                    ))}
                  </div>
                </div>
                <p className="card-text fst-italic mb-0">"{testimonial.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer tối ưu */}
      <footer className="text-white py-4 text-center position-relative footer-bg">
        <div className="container position-relative">
          <h3 className="text-warning mb-4" data-aos="fade-up">Liên hệ với chúng tôi</h3>
          <div className="row justify-content-center">
            {contacts.map((contact, index) => (
              <div 
                key={index} 
                className="col-md-4 mb-3" 
                data-aos="fade-up" 
                data-aos-delay={index * 100}
              >
                <p className="mb-0">
                  <span className="fs-5 me-2">{contact.icon}</span> {contact.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4" data-aos="fade-up" data-aos-delay="200">
            {socials.map((social, index) => (
              <a 
                key={index} 
                href="#" 
                className="btn btn-outline-light mx-2 rounded-circle social-btn"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
          <p className="mt-4 mb-0" data-aos="fade-up" data-aos-delay="400">
            © {new Date().getFullYear()} PRDrink. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </footer>

      {/* CSS inline được chuyển thành global hoặc module */}
      <style jsx>{`
        .product-card:hover {
          transform: translateY(-10px) !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2) !important;
        }
        
        .product-card img {
          transition: transform 0.5s ease;
        }
        
        .product-card:hover img {
          transform: scale(1.1);
        }
        
        .btn-outline-warning:hover {
          background-color: #ffc107 !important;
          color: #212529 !important;
        }
        
        .feature-card:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        
        .testimonial-card {
          background: rgba(255, 248, 230, 0.5);
          border-radius: 15px;
          transition: all 0.3s ease;
        }
        
        .testimonial-card:hover {
          transform: translateY(-5px) !important;
        }
        
        .social-btn {
          width: 50px;
          height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }
        
        .social-btn:hover {
          transform: translateY(-5px) !important;
          background-color: rgba(255,255,255,0.2) !important;
        }
        
        .footer-bg {
          background: linear-gradient(45deg, #1a1a1a, #343a40);
        }
        
        .footer-bg::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(circle, transparent 20%, black 70%);
          opacity: 0.4;
        }
        
        @media (max-width: 768px) {
          .display-4 {
            font-size: 2.5rem;
          }
          
          .lead {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;