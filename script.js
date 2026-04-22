(function () {
  // 每次进入页面强制从顶部开始，避免浏览器滚动恢复导致动画状态错误
  // 注：scrollRestoration 已在 head 内联脚本中设置为 manual，这里再确认一次。
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const jumpToTop = () => {
    // 用 instant 避免 CSS 的 smooth 行为导致"从 about 缓慢滚到顶部"的过渡动画
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  };

  jumpToTop();
  // 下一帧再强制一次，兜底某些浏览器在 defer 脚本后仍会尝试还原位置
  requestAnimationFrame(jumpToTop);

  // 处理 BFCache 回访（点"返回"回到本页）：persisted=true 时浏览器会恢复旧状态
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      jumpToTop();
    }
  });
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const year = document.querySelector("[data-year]");
  const form = document.querySelector("[data-contact-form]");
  const submitButton = document.querySelector("[data-submit-button]");
  const formStatus = document.querySelector("[data-form-status]");
  const sections = Array.from(document.querySelectorAll("[data-section]"));

  const config = window.RBP_CONFIG || {};
  const contactEmail = config.contactEmail || "connect@rainbowpetopia.com";
  const formEndpoint = config.formEndpoint || "";
  const formFormat = config.formFormat || "json";

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const closeMenu = () => {
    if (!menuToggle || !nav) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };

  const openMenu = () => {
    if (!menuToggle || !nav) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
    header?.classList.remove("is-hidden");
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  const setActiveLink = (sectionId) => {
    navLinks.forEach((link) => {
      const targetId = link.getAttribute("href")?.slice(1);
      link.classList.toggle("is-active", targetId === sectionId || (sectionId === "home" && targetId === "top"));
    });
  };

  if ("IntersectionObserver" in window && sections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        setActiveLink(visible.target.id || visible.target.dataset.section || "home");
      },
      {
        threshold: [0.35, 0.6],
        rootMargin: "-20% 0px -35% 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));
    setActiveLink("home");
  }

  let lastScrollY = window.scrollY;

  const updateHeaderState = () => {
    if (!header) {
      return;
    }

    const currentScrollY = window.scrollY;
    const isMenuOpen = menuToggle?.getAttribute("aria-expanded") === "true";

    header.classList.toggle("is-scrolled", currentScrollY > 20);

    if (isMenuOpen || currentScrollY <= 80) {
      header.classList.remove("is-hidden");
      lastScrollY = currentScrollY;
      return;
    }

    if (currentScrollY > lastScrollY + 8 && currentScrollY > 120) {
      header.classList.add("is-hidden");
    } else if (currentScrollY < lastScrollY - 8) {
      header.classList.remove("is-hidden");
    }

    lastScrollY = currentScrollY;
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  // Hero 整体（背景+标题）sticky 固定，随滚动缩小淡出
  const heroStage = document.querySelector(".hero-stage");
  const heroFrame = document.querySelector(".hero__frame");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 明确初始化为完整展开状态
  if (heroFrame) {
    heroFrame.style.transform = "scale(1)";
    heroFrame.style.opacity   = "1";
  }

  const updateHeroScroll = () => {
    if (!heroStage || !heroFrame || reducedMotion) return;

    const viewH   = window.innerHeight;
    const stageH  = heroStage.offsetHeight;
    const scrollY = window.scrollY;

    // 防御：非常靠近顶部时强制完整展开，避免滚动恢复等导致的初始淡出
    if (scrollY < 4) {
      heroFrame.style.transform = "scale(1)";
      heroFrame.style.opacity   = "1";
      return;
    }

    // 开始就略微淡出（10% 屏高），stage 快结束时完成，让切换更紧凑
    const animStart = viewH * 0.1;
    const animEnd   = stageH - viewH;
    const progress  = Math.min(Math.max((scrollY - animStart) / (animEnd - animStart), 0), 1);

    heroFrame.style.transform = `scale(${1 - progress * 0.35})`;
    heroFrame.style.opacity   = String(1 - progress);
  };

  updateHeroScroll();
  window.addEventListener("scroll", updateHeroScroll, { passive: true });

  // About / Work / Contact 滚动驱动：淡入 + 淡出
  const contentSections = Array.from(
    document.querySelectorAll(".section.about, .section.work, .section.contact")
  );

  if (!reducedMotion && contentSections.length > 0) {
    // 初始状态：大幅下移 + 明显缩小，弹入时反差更强
    contentSections.forEach((sec) => {
      sec.style.opacity   = "0";
      sec.style.transform = "translateY(240px) scale(0.80)";
    });

    const updateSections = () => {
      const viewH = window.innerHeight;

      contentSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();

        // 线性淡入：顶部从视口下方 0.25 屏开始，到视口上部 25% 完成
        // 全程匀速（线性），保持"缓慢过渡放大"的观感，不再闪现
        const enterP = Math.min(Math.max(
          (viewH * 1.25 - rect.top) / (viewH * 1.0), 0), 1);

        // 淡出：section 底部从 viewH*0.45 滚到 0 → progress 0→1
        const exitP = rect.bottom < viewH * 0.45
          ? Math.min(Math.max(1 - rect.bottom / (viewH * 0.45), 0), 1)
          : 0;

        const opacity   = enterP < 1 ? enterP : 1 - exitP;
        const translateY = (1 - enterP) * 240;                // 240px 大幅下移，弹入更显眼
        const scaleVal   = enterP < 1
          ? 0.80 + enterP * 0.20                               // 进入：0.80 → 1 线性
          : 1 - exitP * 0.1;                                   // 退出：1 → 0.9

        sec.style.opacity   = String(Math.max(0, opacity));
        sec.style.transform = `translateY(${translateY.toFixed(1)}px) scale(${scaleVal.toFixed(4)})`;
      });
    };

    updateSections();
    window.addEventListener("scroll", updateSections, { passive: true });
  }

  // About 长文字逐行淡入效果
  const aboutCopy = document.querySelector(".about__copy");
  if (aboutCopy && !reducedMotion) {
    const aboutLines = Array.from(aboutCopy.querySelectorAll(".about__line"));
    const aboutQuote = aboutCopy.querySelector(".about__quote");
    const closingWords = Array.from(aboutCopy.querySelectorAll(".about__closing .rainbow-word"));
    const aboutClosing = aboutCopy.querySelector(".about__closing");

    if ("IntersectionObserver" in window) {
      const lineObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const lines = Array.from(entry.target.querySelectorAll(".about__line"));
              const quote = entry.target.querySelector(".about__quote");
              const words = Array.from(entry.target.querySelectorAll(".about__closing .rainbow-word"));
              const closing = entry.target.querySelector(".about__closing");
              const allElements = [...lines];

              // 添加 quote 和 closing 作为独立元素
              if (quote) allElements.push(quote);
              allElements.push(...words);
              if (closing) allElements.push(closing);

              allElements.forEach((element, index) => {
                setTimeout(() => {
                  element.classList.add("line-visible");
                  element.style.animationDelay = `${index * 0.12}s`;
                }, 0);
              });
              lineObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
      );

      if (aboutLines.length > 0 || aboutQuote || closingWords.length > 0 || aboutClosing) {
        lineObserver.observe(aboutCopy);
      }
    }
  }

  const setStatus = (message, type) => {
    if (!formStatus) {
      return;
    }

    formStatus.textContent = message;
    formStatus.classList.toggle("is-error", type === "error");
    formStatus.classList.toggle("is-success", type === "success");
  };

  const createMailtoFallback = (values) => {
    const subject = "Rainbow Petopia inquiry";
    const lines = [
      values.firstName || values.lastName ? `Name: ${[values.firstName, values.lastName].filter(Boolean).join(" ")}` : "",
      `Email: ${values.email}`,
      "",
      values.message,
    ].filter(Boolean);

    return `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  const serializeForm = (formElement) => {
    const data = new FormData(formElement);
    return {
      firstName: String(data.get("firstName") || "").trim(),
      lastName: String(data.get("lastName") || "").trim(),
      email: String(data.get("email") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
  };

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const values = serializeForm(form);
      if (!values.message) {
        setStatus("Please add a message before sending.", "error");
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
      }
      setStatus("Sending your note...", "");

      try {
        if (!formEndpoint) {
          window.location.href = createMailtoFallback(values);
          setStatus("Your email app has been opened with the message ready to send.", "success");
          form.reset();
          return;
        }

        let response;
        if (formFormat === "form-data") {
          const payload = new FormData();
          Object.entries(values).forEach(([key, value]) => payload.append(key, value));
          response = await fetch(formEndpoint, {
            method: "POST",
            body: payload,
          });
        } else {
          response = await fetch(formEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(values),
          });
        }

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        form.reset();
        setStatus(config.successMessage || "Thanks for your note. We will be in touch soon.", "success");
      } catch (error) {
        console.error(error);
        setStatus(
          "The message could not be sent right now. You can still email us directly at connect@rainbowpetopia.com.",
          "error",
        );
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }
})();
