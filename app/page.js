import React from 'react';
import Script from 'next/script';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div>
      {/* Header */}
      <header className="masthead h-100 d-flex gap-4">
        <div className="container text-center my-auto">
          <h1 className="my-1 display-6">Hi, I'm Abhishek Maurya</h1>
          <p className="my-2 text-white display-6 fw-bold">
            I build website and web applications to help you run your business
            efficiently and smoothly.
          </p>
          <a
            className="btn btn-primary btn-xl"
            href="https://api.whatsapp.com/send?phone=+917842740174&text=Hi,%20I%20have%20a%20question%20about%20your%20portfolio..."
            target="_blank"
            rel="noopener"
          ><i className="fab fa-whatsapp"></i> WhatsApp</a>
        </div>
      </header>
      {/* Portfolio */}
      <section className="content-section" id="portfolio">
        <div className="container">
          <div className="content-section-heading text-center">
            <h2 className="mb-5">Recent Projects</h2>
          </div>
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4">
            <div className="col">
              <div className="card border-0 shadow">
                <Image
                  src="https://res.cloudinary.com/xpsabhi/image/upload/q_auto/v1621832257/IMG_1725.png"
                  className="card-img-top"
                  alt="swechha farms"
                  width={500}
                  height={300}
                />
                <div className="card-body">
                  <h5 className="card-title">swechhafarms.com</h5>
                  <p className="card-text">
                    This farms is delivering the naturally grown vegetables
                    without using any sythetic pesticides. Farming is based on Dr.
                    Palekar natural method.
                  </p>
                  <a
                    className="btn btn-primary stretched-link"
                    href="https://swechhafarms.in"
                    target="_blank"
                    rel="noopener"
                    role="button"
                  >Visit App</a>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card border-0 shadow">
                <Image
                  src="https://res.cloudinary.com/xpsabhi/image/upload/q_auto/v1587010523/covid-app.png"
                  className="card-img-top"
                  alt="shops tracking"
                  width={500}
                  height={300}
                />
                <div className="card-body">
                  <h5 className="card-title">covid19open.in</h5>
                  <p className="card-text">
                    This app tracks shops open nearby during lockdown. You can get
                    shop location and available items there such as Milk,
                    vegetables, water, groceries, fruits etc.
                  </p>
                  <p className="card-text text-danger">
                    Same feature is available on GPay. They know whoever is
                    accepting payment via GPay are open.
                  </p>
                  <a
                    className="btn btn-primary"
                    href="#"
                    target="_blank"
                    rel="noopener"
                    role="button"
                  >App Closed</a>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card border-0 shadow">
                <Image
                  src="https://res.cloudinary.com/xpsabhi/image/upload/q_auto/v1621832258/IMG_1726.png"
                  className="card-img-top"
                  alt="shops tracking"
                  width={500}
                  height={300}
                />
                <div className="card-body">
                  <h5 className="card-title">uberpro.in</h5>
                  <p className="card-text">Order management app.</p>
                  <a
                    className="btn btn-primary stretched-link"
                    href="https://uberpro.in"
                    target="_blank"
                    rel="noopener"
                    role="button"
                  >Visit App</a>
                </div>
              </div>
            </div>
            <div className="col">
              <div className="card border-0 shadow">
                <Image
                  src="https://res.cloudinary.com/xpsabhi/image/upload/q_auto/v1621832258/IMG_1724.png"
                  className="card-img-top"
                  alt="shops tracking"
                  width={500}
                  height={300}
                />
                <div className="card-body">
                  <h5 className="card-title">selftest.app</h5>
                  <p className="card-text">Govt job preparation app.</p>
                  <a
                    className="btn btn-primary stretched-link"
                    href="https://selftest.app"
                    target="_blank"
                    rel="noopener"
                    role="button"
                  >Visit App</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="experience" className="bg-success py-5">
        <div className="container">
          <div className="content-section-heading text-center text-white">
            <h2 className="mb-5">Work Experience</h2>
          </div>
          <div className="card border-0 shadow my-3">
            <div className="card-body">
              <p className="lead">Reputation - Lead Engineer</p>
              <span className="text-muted">SEP 2020 - Working</span>
              <p className="card-text">
                Some exciting stuff... react, angular, node etc..
              </p>
            </div>
          </div>

          <div className="card border-0 shadow my-.3">
            <div className="card-body">
              <p className="lead">Freelancing and Side Projects</p>
              <span className="text-muted">JUL 2017 - Aug 2020</span>
              <p className="card-text">
                Working on everything from idea to making it profitable.
                Brainstorming, idea testing, initial sales, building a web app
                (PWA). <br />Along the way applying growth hacks, SEO, customer
                experience, customer support to grow the business and customer
                confidence.
              </p>
            </div>
          </div>

          <div className="card border-0 shadow my-3">
            <div className="card-body">
              <p className="lead">Eze Software - Senior Developer</p>
              <span className="text-muted">JUN 2016 - JUN 2017</span>
              <p className="card-text">
                Developing and improving Order Management System for real time
                trading related to short and sell. Maintaining two product
                EzeLocate and DataFeed for locating Short inventory for real time
                stock data processing.
              </p>
            </div>
.          </div>
          <div className="card border-0 shadow my-3">
            <div className="card-body">
              <p className="lead">Oracle India Pvt. Ltd. - Project Leader</p>
              <span className="text-muted">JUN 2010 - MAY 2016</span>
              <p className="card-text">
                Developing and improving Plan Copy and Benefits Relationships
                under Oracle Fusion codebase. A large HCM application.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section id="patent" className="bg-info py-5">
        <div className="container">
          <div className="content-section-heading text-center text-white">
            <h2 className="mb-5">Patent</h2>
          </div>
          <div className="card border-0 shadow my-3">
            <div className="card-body">
              <p className="lead">
                Importing tested objects into benefits programs deployed on
                production systems
              </p>
              <p className="card-text">Status - Abandoned</p>
              <a
                className="btn btn-primary"
                href="http://google.com/patents/US20150046358"
                role="button"
                target="_blank"
                rel="noopener"
              >Google Patents</a>
            </div>
          </div>
        </div>
      </section>
      <section id="education" className="bg-danger py-5">
        <div className="container">
          <div className="content-section-heading text-center text-white">
            <h2 className="mb-5">Education</h2>
          </div>
          <div className="card border-0 shadow my-3">
            <div className="card-body">
              <p className="lead">
                National Institute of Technology Trichy Tamilnadu- INDIA
              </p>
              <span className="text-muted">JUL 2007 - JUN 2010</span>
              <p className="card-text">Master of Computer Applications</p>
            </div>
          </div>
          <div className="card border-0 shadow my-3">
            <div className="card-body">
              <p className="lead">Banaras Hindu University, Varanasi UP — INDIA</p>
              <span className="text-muted">JUL 2003 - JUN 2006</span>
              <p className="card-text">Bachelor of Science - Mathematics (Honours)</p>
            </div>
          </div>
        </div>
      </section>
      <section id="contact"></section>
      {/* Footer */}
      <footer className="footer text-center">
        <div className="container">
          <ul className="list-inline mb-5">
            <li className="list-inline-item">
              <a
                className="
                  social-link
                  rounded-circle
                  text-white
                  mr-3
                  text-decoration-none
                "
                href="https://m.me/abhishek.k.maurya"
                target="_blank"
                rel="noopener"
              >
                <i className="icon-social-facebook"></i>
              </a>
            </li>
            <li className="list-inline-item">
              <a
                className="
                  social-link
                  rounded-circle
                  text-white
                  mr-3
                  text-decoration-none
                "
                href="https://twitter.com/xpressabhi"
                target="_blank"
                rel="noopener"
              >
                <i className="icon-social-twitter"></i>
              </a>
            </li>
            <li className="list-inline-item">
              <a
                className="social-link rounded-circle text-white text-decoration-none"
                href="https://github.com/xpressabhi"
                target="_blank"
                rel="noopener"
              >
                <i className="icon-social-github"></i>
              </a>
            </li>
            <li className="list-inline-item">
              <a
                className="social-link rounded-circle text-white text-decoration-none"
                href="https://www.linkedin.com/in/akm85/"
                target="_blank"
                rel="noopener"
              >
                <i className="icon-social-linkedin"></i>
              </a>
            </li>
          </ul>
          <p className="lead">
            Wanna get in touch or talk about a project? <br />
            Feel free to contact me via email at <b>akmnitt@gmail.com</b> <br />
            or drop a line
            <b><a
                href="https://goo.gl/forms/tHSCcdgCqufziUi53"
                target="_blank"
                rel="noopener"
                className="text-decoration-none"
              >Contact form</a></b>
            <br />
            or skype me @ <b> cool.akmaurya</b>
          </p>

          <p className="text-muted small mb-0">
            Copyright &copy; Abhishek Maurya 2021
          </p>
        </div>
      </footer>

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-gtEjrD/SeCtmISkJkNUaaKMoLD0//ElJ19smozuHV6z3Iehds+3Ulb9Bn9Plx0x4"
        crossOrigin="anonymous"
      />
      <Script defer src="/js/lazyload.js" />
    </div>
  );
}
