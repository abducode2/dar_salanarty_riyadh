const fs = require("fs");
const path = require("path");

const newFooter = `
    <!-- بداية الفوتر الجديد -->
    <footer class="modern-footer">
      <div class="container footer-container">
        <div class="footer-col about-col">
          <h3><i class="fas fa-building"></i> دار أبناء سلنارتي</h3>
          <p>النظام التقني الشامل لإدارة الاشتراكات والمصروفات ولجان الدار بالرياض.</p>
        </div>
        <div class="footer-col links-col">
          <h3><i class="fas fa-link"></i> روابط سريعة</h3>
          <ul>
            <li><a href="./index.html">الصفحة الرئيسية</a></li>
            <li><a href="./accounts.html">سجل الحسابات</a></li>
            <li><a href="./members.html">قائمة الأعضاء</a></li>
            <li><a href="./reports.html">التقارير المالية</a></li>
          </ul>
        </div>
        <div class="footer-col contact-col">
          <h3><i class="fas fa-headset"></i> الدعم الفني</h3>
          <p><i class="fas fa-envelope"></i> <a href="mailto:salanarty@gmail.com">salanarty@gmail.com</a></p>
          <p><i class="fab fa-whatsapp"></i> <a href="https://wa.me/966502191635" target="_blank" 
          title="تواصل معنا عبر واتساب"
          aria-label="تواصل معنا عبر واتساب"
          dir="ltr"
          rel="noopener noreferrer">+966 50 219 1635</a></p>
          <p><i class="fas fa-phone"></i><a href="tel:+966510219163" 
            target="_blank" 
            title="تواصل معنا عبر الهاتف"
            aria-label="تواصل معنا عبر الهاتف"
            dir="ltr"
            rel="noopener noreferrer">+966 51 021 9163</a>
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container footer-bottom-container">
          <p>جميع الحقوق محفوظة © دار أبناء سلنارتي بالرياض 2024</p>
          <p class="version">الإصدار 1.0.1</p>
        </div>
      </div>
    </footer>
    
    <!-- زر الصعود للأعلى -->
    <button id="backToTopBtn" title="العودة للأعلى"><i class="fas fa-arrow-up"></i></button>
    <!-- نهاية الفوتر الجديد -->`;

const dir = __dirname;
const files = fs.readdirSync(dir);
const htmlFiles = files.filter(
  (f) => f.endsWith(".html") && f !== "login.html",
);

htmlFiles.forEach((file) => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf8");

  const footerRegex = /<footer[\s\S]*?<\/footer>/;

  if (footerRegex.test(content)) {
    content = content.replace(footerRegex, newFooter.trim());
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Updated", file);
  }
});

const cssContent = `
/* =========================================
   Modern Footer & Back to Top
   ========================================= */
.modern-footer {
  background: #046738;
  color: #fff;
  padding: 40px 0 0 0;
  margin-top: 50px;
  box-shadow: 0 -4px 10px rgba(0,0,0,0.1);
  font-family: 'Cairo', sans-serif;
  text-align: right;
  direction: rtl;
}

.footer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.footer-col {
  flex: 1;
  min-width: 250px;
}

.footer-col h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  border-bottom: 2px solid rgba(255,255,255,0.2);
  padding-bottom: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-col p {
  color: #e0e0e0;
  line-height: 1.6;
  margin-bottom: 10px;
}

.footer-col p i {
  margin-left: 8px;
  color: var(--secondary-color, #f57c00);
}

.footer-col a {
  color: #e0e0e0;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-col a:hover {
  color: #fff;
  text-decoration: underline;
}

.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-col ul li {
  margin-bottom: 10px;
}

.footer-col ul li a {
  display: flex;
  align-items: center;
}

.footer-col ul li a::before {
  content: "\\f104";
  font-family: "Font Awesome 6 Free";
  font-weight: 900;
  margin-left: 8px;
  font-size: 0.9em;
  color: var(--secondary-color, #f57c00);
}

.footer-bottom {
  background: #034b28;
  padding: 15px 0;
}

.footer-bottom-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.footer-bottom p {
  margin: 0;
  font-size: 0.9rem;
  color: #ccc;
}

.version {
  font-weight: bold;
  background: rgba(255,255,255,0.1);
  padding: 4px 10px;
  border-radius: 15px;
}

/* Back to Top Button */
#backToTopBtn {
  display: none;
  position: fixed;
  bottom: 30px;
  left: 30px; /* يسار الشاشة ليتوافق مع الاتجاه العربي */
  z-index: 99;
  border: none;
  outline: none;
  background-color: var(--secondary-color, #f57c00);
  color: white;
  cursor: pointer;
  padding: 15px;
  border-radius: 50%;
  font-size: 18px;
  width: 50px;
  height: 50px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  transition: background-color 0.3s, transform 0.3s;
}

#backToTopBtn:hover {
  background-color: var(--primary-color, #046738);
  transform: translateY(-3px);
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
  }
  .footer-bottom-container {
    justify-content: center;
    gap: 10px;
  }
  #backToTopBtn {
    bottom: 20px;
    left: 20px;
    width: 45px;
    height: 45px;
  }
}
`;
fs.appendFileSync(path.join(dir, "style", "style.css"), cssContent, "utf8");
console.log("Appended CSS to style.css");

const jsContent = `
// =========================================
// Back to Top Button Logic
// =========================================
document.addEventListener("DOMContentLoaded", function() {
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    window.addEventListener("scroll", function() {
      if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        backToTopBtn.style.display = "block";
      } else {
        backToTopBtn.style.display = "none";
      }
    });

    backToTopBtn.addEventListener("click", function() {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});
`;
fs.appendFileSync(path.join(dir, "js", "javascript.js"), jsContent, "utf8");
console.log("Appended JS to javascript.js");
