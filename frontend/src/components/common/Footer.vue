<template>
  <footer class="site-footer">
    <div class="footer-main">
      <div class="container">
        <div class="footer-info">
          <div class="footer-section about-section">
            <h3>About Us</h3>
            <p>我们是一家专业从事汽车用品研发、生产和销售的公司，拥有多年的行业经验和专业技术。我们致力于为客户提供高品质、高性能的汽车用品。</p>
            <div class="social-links">
              <a href="#" title="Facebook"><i class="el-icon-s-platform"></i></a>
              <a href="#" title="Twitter"><i class="el-icon-s-promotion"></i></a>
              <a href="#" title="Instagram"><i class="el-icon-picture-outline"></i></a>
              <a href="#" title="LinkedIn"><i class="el-icon-s-custom"></i></a>
            </div>
          </div>
          
          <div class="footer-section contact-section">
            <h3>联系我们</h3>
            <ul class="contact-info">
              <li>
                <i class="el-icon-location-information"></i>
                <span>123 Auto Street, Vehicle City</span>
              </li>
              <li>
                <i class="el-icon-phone"></i>
                <span>+86 123 4567 8910</span>
              </li>
              <li>
                <i class="el-icon-message"></i>
                <span>contact@autoease.com</span>
              </li>
              <li>
                <i class="el-icon-time"></i>
                <span>周一至周五: 9:00 - 18:00</span>
              </li>
            </ul>
          </div>
          
          <div class="footer-section qrcode-section">
            <h3>关注我们</h3>
            <div class="qrcode">
              <img src="../../assets/images/qrcode.png" alt="微信二维码">
              <p>扫描二维码关注我们</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <div class="container">
        <p class="copyright">© 2023 AUTO EASE EXPERT CO., LTD. All Rights Reserved</p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.site-footer {
  background-color: #333;
  color: #fff;
  margin-top: 50px;
}

.footer-main {
  padding: 50px 0;
}

.footer-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.footer-section {
  flex: 1;
  min-width: 250px;
  margin-right: 30px;
  margin-bottom: 30px;
}

.footer-section:last-child {
  margin-right: 0;
}

.footer-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 10px;
}

.footer-section h3:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 2px;
  background-color: #e60012;
}

.about-section p {
  line-height: 1.6;
  margin-bottom: 20px;
  color: #ccc;
}

.social-links {
  display: flex;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: rgba(255,255,255,0.1);
  border-radius: 50%;
  margin-right: 10px;
  color: #fff;
  transition: background-color 0.3s;
}

.social-links a:hover {
  background-color: #e60012;
}

.contact-info {
  list-style: none;
  padding: 0;
  margin: 0;
}

.contact-info li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  color: #ccc;
}

.contact-info i {
  margin-right: 10px;
  margin-top: 3px;
  color: #e60012;
}

.qrcode {
  text-align: center;
}

.qrcode img {
  width: 120px;
  height: 120px;
  background-color: #fff;
  padding: 5px;
  margin-bottom: 10px;
}

.qrcode p {
  font-size: 14px;
  color: #ccc;
}

.footer-bottom {
  background-color: #222;
  padding: 15px 0;
  text-align: center;
}

.copyright {
  margin: 0;
  font-size: 14px;
  color: #999;
}

@media (max-width: 768px) {
  .footer-info {
    flex-direction: column;
  }
  
  .footer-section {
    margin-right: 0;
    margin-bottom: 30px;
  }
}
</style>