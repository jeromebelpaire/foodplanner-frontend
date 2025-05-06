export function CookiePolicyPage() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="mb-4">Cookie Policy</h1>
          <p className="text-muted">Last Updated: May 6, 2025</p>

          <p>
            This Cookie Policy explains how ShareSpice uses cookies on our website. By using our
            website, you acknowledge that we use the cookies described below.
          </p>

          <h2 className="h4 mt-4">What are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your computer or mobile device when you
            visit a website. They help websites remember information about your visit, like your
            login status or preferences, which can make your next visit easier and the site more
            useful to you.
          </p>

          <h2 className="h4 mt-4">How We Use Cookies</h2>
          <p>
            We use a minimal number of cookies, and only those that are strictly necessary for the
            functioning of our website and to provide services you have explicitly requested.
            Currently, we use the following types of cookies:
          </p>

          <h3 className="h5 mt-3">1. Session Cookies (Strictly Necessary)</h3>
          <p>
            These cookies are essential to allow you to move around the website and use its
            features, such as accessing secure areas (e.g., your user account). Without these
            cookies, services like user login cannot be provided. Session cookies are temporary and
            are deleted from your device when you close your browser.
          </p>
          <ul>
            <li>
              <strong>Purpose:</strong> To maintain your logged-in session after you authenticate.
            </li>
            <li>
              <strong>Duration:</strong> Expires when you close your browser or your session times
              out.
            </li>
          </ul>

          <h3 className="h5 mt-3">
            2. CSRF (Cross-Site Request Forgery) Cookies (Strictly Necessary)
          </h3>
          <p>
            These cookies are used to enhance the security of our website. They help protect against
            unauthorized actions being performed on your behalf when you are logged in. These are
            essential for protecting your account and data integrity.
          </p>
          <ul>
            <li>
              <strong>Purpose:</strong> To protect against cross-site request forgery attacks,
              ensuring that requests to our server are legitimate.
            </li>
            <li>
              <strong>Duration:</strong> Typically expires with your session or after a set period
              for security reasons.
            </li>
          </ul>

          <h2 className="h4 mt-4">Your Choices Regarding Cookies</h2>
          <p>
            Because the cookies we use are strictly necessary for the operation of the website and
            its security, there is no option to disable them and continue using the authenticated
            parts of our service. Most web browsers allow some control of most cookies through the
            browser settings. However, if you block strictly necessary cookies, you may not be able
            to access all or parts of our site.
          </p>

          <h2 className="h4 mt-4">Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We will notify you of any changes by
            posting the new Cookie Policy on this page and updating the "Last Updated" date.
          </p>

          <h2 className="h4 mt-4">Contact Us</h2>
          <p>
            If you have any questions about our use of cookies, please contact us at
            sharespice.info@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}
