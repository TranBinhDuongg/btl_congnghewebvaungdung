import { useState, useEffect, useRef } from "react";

const C = {
  forest: "#0f2918", deep: "#071a0e", green: "#2d7a2d", lime: "#56c456",
  mist: "#f0f7f0", white: "#ffffff", soil: "#3b2a1a", gold: "#c8a84b",
  gray: "#6b7280", lightBg: "#f4f9f4",
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(32px)", transition: `opacity .7s ${delay}s, transform .7s ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const navLinks = [
    { href: "#features", label: "Tính năng" }, { href: "#roles", label: "Vai trò" },
    { href: "#how", label: "Quy trình" }, { href: "#benefits", label: "Lợi ích" },
    { href: "#contact", label: "Liên hệ" },
  ];
  return (
    <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 1000, background: scrolled ? "rgba(7,26,14,0.97)" : "transparent", backdropFilter: scrolled ? "blur(14px)" : "none", borderBottom: scrolled ? "1px solid rgba(86,196,86,0.12)" : "none", transition: "all .35s" }}>
      <style>{`@media(min-width:768px){.nav-item{display:list-item!important}}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}html{scroll-behavior:smooth}`}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#56c456,#2d7a2d)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌿</div>
          <span style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: 20, fontWeight: 900, color: C.white, letterSpacing: 0.5 }}>AgriChain</span>
        </a>
        <ul style={{ display: "flex", listStyle: "none", gap: 32, margin: 0, padding: 0 }}>
          {navLinks.map(n => (
            <li key={n.href} style={{ display: "none" }} className="nav-item">
              <a href={n.href} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: 14, fontWeight: 600, letterSpacing: 0.3, transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.lime)}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}>{n.label}</a>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/login" style={{ padding: "9px 20px", border: "1.5px solid rgba(86,196,86,0.5)", borderRadius: 8, color: C.lime, textDecoration: "none", fontSize: 13, fontWeight: 700, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(86,196,86,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>Đăng nhập</a>
          <a href="/register" style={{ padding: "9px 20px", background: "linear-gradient(135deg,#56c456,#2d7a2d)", borderRadius: 8, color: C.white, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Đăng ký</a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ minHeight: "100vh", background: `linear-gradient(160deg,${C.deep} 0%,${C.forest} 45%,#162e1a 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "100px 24px 60px" }}>
      <div style={{ position: "absolute", top: "15%", left: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(86,196,86,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "6%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(200,168,75,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(86,196,86,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(86,196,86,0.03) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 820, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(86,196,86,0.1)", border: "1px solid rgba(86,196,86,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 28, animation: "fadeUp .6s both" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.lime, display: "inline-block" }} />
          <span style={{ fontSize: 12, color: C.lime, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>Nền tảng quản lý nông sản số #1</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: C.white, lineHeight: 1.15, marginBottom: 24, animation: "fadeUp .7s .1s both" }}>
          Chuỗi cung ứng<br /><span style={{ color: C.lime }}>nông sản</span> minh bạch
        </h1>
        <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 40px", animation: "fadeUp .7s .2s both" }}>
          Từ trang trại đến siêu thị — AgriChain kết nối toàn bộ chuỗi cung ứng, đảm bảo an toàn thực phẩm và truy xuất nguồn gốc hoàn chỉnh.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp .7s .3s both" }}>
          <a href="/register" style={{ padding: "14px 32px", background: "linear-gradient(135deg,#56c456,#2d7a2d)", color: C.white, textDecoration: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, boxShadow: "0 8px 24px rgba(86,196,86,0.3)" }}>🚀 Đăng ký miễn phí</a>
          <a href="/login" style={{ padding: "14px 32px", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.35)", color: C.white, textDecoration: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, backdropFilter: "blur(4px)" }}>🔑 Đăng nhập</a>
        </div>
        <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", marginTop: 60, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.08)", animation: "fadeUp .7s .45s both" }}>
          {[["1,200+", "Nông dân"], ["340+", "Đại lý"], ["85+", "Siêu thị"], ["99.8%", "Uptime"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.lime, fontFamily: "'Playfair Display','Georgia',serif" }}>{v}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, letterSpacing: 0.5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: "📋", title: "Đăng ký lô nông sản", desc: "Ghi nhận nguồn gốc, chứng nhận VietGAP/GlobalGAP và thông tin chi tiết từng lô hàng" },
  { icon: "🔍", title: "Truy xuất QR Code", desc: "Quét mã QR để xem toàn bộ hành trình từ trang trại đến tay người tiêu dùng" },
  { icon: "🚛", title: "Quản lý vận chuyển", desc: "Theo dõi lộ trình, kho trung gian và đảm bảo chất lượng suốt quá trình vận chuyển" },
  { icon: "🔬", title: "Kiểm định chất lượng", desc: "Biên bản kiểm tra, chữ ký số và cam kết an toàn thực phẩm cho người tiêu dùng" },
  { icon: "📊", title: "Báo cáo & Thống kê", desc: "Phân tích sản lượng, tồn kho và tối ưu hóa toàn bộ chuỗi cung ứng theo thời gian thực" },
  { icon: "🔔", title: "Cảnh báo tự động", desc: "Thông báo lô quá hạn, nhiệt độ bất thường và các sự cố trong chuỗi cung ứng ngay lập tức" },
];

function Features() {
  return (
    <section id="features" style={{ padding: "100px 24px", background: C.lightBg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: C.mist, border: "1px solid rgba(45,122,45,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: C.green, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Tính năng nổi bật</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: C.forest, marginBottom: 14 }}>Giải pháp toàn diện</h2>
            <p style={{ fontSize: 17, color: C.gray, maxWidth: 500, margin: "0 auto" }}>Hệ thống quản lý tích hợp cho toàn bộ chuỗi cung ứng nông sản</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 24 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.07}>
              <div style={{ background: C.white, borderRadius: 16, padding: "32px 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)", transition: "all .25s", cursor: "default" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(45,122,45,0.14)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>
                <div style={{ width: 56, height: 56, background: `linear-gradient(135deg,${C.lime}22,${C.green}11)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 20, border: `1px solid ${C.lime}33` }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.forest, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLES_DATA = [
  { icon: "🌾", title: "Nông dân", subtitle: "Quản lý trang trại & sản xuất", color: "#2d7a2d", bgFrom: "#f0f9f0", features: ["Đăng ký lô nông sản", "Quản lý chứng nhận VietGAP", "Theo dõi sản lượng", "Tạo mã QR truy xuất"] },
  { icon: "🚛", title: "Đại lý", subtitle: "Vận chuyển & phân phối", color: "#1565c0", bgFrom: "#e8f0fe", features: ["Quản lý vận chuyển", "Theo dõi kho trung gian", "Cập nhật trạng thái", "Báo cáo giao hàng"] },
  { icon: "🛒", title: "Siêu thị", subtitle: "Bán lẻ cho người tiêu dùng", color: "#7c3aed", bgFrom: "#f3eeff", features: ["Nhận hàng và kiểm tra", "Quản lý tồn kho", "Truy xuất nguồn gốc", "Báo cáo bán hàng"] },
];

function Roles() {
  return (
    <section id="roles" style={{ padding: "100px 24px", background: C.white }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: C.mist, border: "1px solid rgba(45,122,45,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: C.green, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Đối tượng sử dụng</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: C.forest, marginBottom: 14 }}>Dành cho mọi vai trò</h2>
            <p style={{ fontSize: 17, color: C.gray }}>Hệ thống hỗ trợ đầy đủ các đối tượng trong chuỗi cung ứng</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
          {ROLES_DATA.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.1}>
              <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", transition: "all .25s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
                <div style={{ background: `linear-gradient(135deg,${r.bgFrom},white)`, padding: "32px 28px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>{r.icon}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: C.forest, marginBottom: 6 }}>{r.title}</h3>
                  <p style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>{r.subtitle}</p>
                </div>
                <div style={{ padding: "24px 28px", background: C.white }}>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {r.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 14, color: "#444" }}>
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: r.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: r.color, fontWeight: 900, flexShrink: 0 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", icon: "🏡", title: "Đăng ký trang trại", desc: "Nông dân đăng ký thông tin, chứng nhận VietGAP và tạo lô nông sản với đầy đủ dữ liệu" },
  { n: "02", icon: "🚛", title: "Vận chuyển", desc: "Đại lý nhận hàng, vận chuyển qua kho trung gian với giám sát liên tục" },
  { n: "03", icon: "🔬", title: "Kiểm định", desc: "Kiểm tra chất lượng tại các điểm, tạo biên bản với chữ ký số xác thực" },
  { n: "04", icon: "🛒", title: "Đến siêu thị", desc: "Người tiêu dùng quét QR để xem toàn bộ hành trình của nông sản" },
];

function HowItWorks() {
  return (
    <section id="how" style={{ padding: "100px 24px", background: `linear-gradient(160deg,${C.deep} 0%,${C.forest} 100%)`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(86,196,86,0.04) 1px,transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: "rgba(86,196,86,0.1)", border: "1px solid rgba(86,196,86,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: C.lime, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Quy trình hoạt động</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: C.white, marginBottom: 14 }}>4 bước đơn giản</h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)" }}>Chuỗi cung ứng nông sản hoạt động liền mạch</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div style={{ textAlign: "center", padding: "32px 20px" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(86,196,86,0.12)", border: "2px solid rgba(86,196,86,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto" }}>{s.icon}</div>
                  <div style={{ position: "absolute", top: -6, right: -10, background: C.lime, color: C.deep, fontSize: 10, fontWeight: 900, borderRadius: 20, padding: "2px 8px" }}>{s.n}</div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.white, marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  { icon: "🔍", title: "Minh bạch 100%", desc: "Theo dõi đầy đủ nguồn gốc, vận chuyển và kiểm định chất lượng mọi lúc mọi nơi" },
  { icon: "🛡️", title: "An toàn thực phẩm", desc: "Đảm bảo chất lượng nông sản, giảm thiểu rủi ro về an toàn vệ sinh thực phẩm" },
  { icon: "⚡", title: "Tăng hiệu quả", desc: "Tối ưu hóa quy trình, giảm thời gian và chi phí vận hành đến 40%" },
  { icon: "🤝", title: "Tăng niềm tin", desc: "Xây dựng lòng tin từ người tiêu dùng với thông tin rõ ràng và minh bạch" },
  { icon: "⏱️", title: "Tiết kiệm thời gian", desc: "Tự động hóa quy trình, giảm công việc giấy tờ thủ công lên đến 70%" },
  { icon: "💾", title: "Dữ liệu tập trung", desc: "Quản lý tất cả thông tin tại một nơi, dễ dàng truy xuất và xuất báo cáo" },
];

function Benefits() {
  return (
    <section id="benefits" style={{ padding: "100px 24px", background: C.lightBg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: C.mist, border: "1px solid rgba(45,122,45,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: C.green, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Lợi ích vượt trội</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, color: C.forest, marginBottom: 14 }}>Giá trị cho toàn chuỗi</h2>
            <p style={{ fontSize: 17, color: C.gray }}>Giải pháp mang lại lợi ích toàn diện cho mọi đối tượng</p>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.07}>
              <div style={{ display: "flex", gap: 18, background: C.white, padding: "24px", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.04)", transition: "all .25s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(45,122,45,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}>
                <div style={{ width: 52, height: 52, background: `linear-gradient(135deg,${C.lime}20,${C.green}12)`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: `1px solid ${C.lime}25` }}>{b.icon}</div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: C.forest, marginBottom: 7 }}>{b.title}</h4>
                  <p style={{ fontSize: 13, color: C.gray, lineHeight: 1.75 }}>{b.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section style={{ padding: "100px 24px", background: `linear-gradient(135deg,${C.forest} 0%,#1a4d1a 100%)`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(86,196,86,0.1),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <Reveal>
          <h2 style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: C.white, marginBottom: 18, lineHeight: 1.2 }}>Sẵn sàng <span style={{ color: C.lime }}>bắt đầu</span>?</h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", marginBottom: 40, lineHeight: 1.7 }}>Tham gia cùng hàng nghìn nông dân, đại lý và siêu thị đang dùng AgriChain để tối ưu chuỗi cung ứng.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/register" style={{ padding: "14px 36px", background: "linear-gradient(135deg,#56c456,#2d7a2d)", color: C.white, textDecoration: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, boxShadow: "0 8px 24px rgba(86,196,86,0.3)" }}>🚀 Đăng ký miễn phí</a>
            <a href="#contact" style={{ padding: "14px 36px", border: "1.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", textDecoration: "none", borderRadius: 10, fontWeight: 700, fontSize: 15 }}>📞 Liên hệ tư vấn</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Liên kết", links: [["#features","Tính năng"],["#roles","Vai trò"],["#benefits","Lợi ích"],["#","Giá cả"],["#","Blog"]] as [string,string][] },
    { title: "Hỗ trợ", links: [["#","Trung tâm trợ giúp"],["#","Hướng dẫn sử dụng"],["#","Câu hỏi thường gặp"],["#","Chính sách bảo mật"],["#","Điều khoản sử dụng"]] as [string,string][] },
  ];
  const socials = [{ label: "fb", icon: "f", hoverBg: "#1877F2" }, { label: "tw", icon: "𝕏", hoverBg: "#1a1a1a" }, { label: "li", icon: "in", hoverBg: "#0A66C2" }];
  return (
    <footer id="contact" style={{ background: "#060e0a", color: C.white, padding: "64px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#56c456,#2d7a2d)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
              <span style={{ fontFamily: "'Playfair Display','Georgia',serif", fontSize: 20, fontWeight: 900, color: C.white }}>AgriChain</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.9, marginBottom: 20 }}>Giải pháp công nghệ toàn diện cho quản lý nông sản và chuỗi cung ứng.</p>
            <div style={{ display: "flex", gap: 10 }}>
              {socials.map(s => (
                <a key={s.label} href="#" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = s.hoverBg; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)"; }}>{s.icon}</a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 18, letterSpacing: 0.5, textTransform: "uppercase" }}>{col.title}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map(([href, label]) => (
                  <li key={label} style={{ marginBottom: 10 }}>
                    <a href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color .2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.lime)}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 18, letterSpacing: 0.5, textTransform: "uppercase" }}>Liên hệ</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[["📍","123 Đường ABC, Q.1, TP.HCM"],["📞","1900 xxxx"],["✉️","info@agrichain.vn"],["🕐","T2–T6: 8:00 – 17:00"]].map(([icon, text]) => (
                <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span><span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 AgriChain. All rights reserved.</p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Điều khoản","Bảo mật","Cookie"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AgriChainLanding() {
  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <Navbar />
      <Hero />
      <Features />
      <Roles />
      <HowItWorks />
      <Benefits />
      <CTA />
      <Footer />
    </div>
  );
}
