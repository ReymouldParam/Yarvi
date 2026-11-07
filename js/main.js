(function () {
  "use strict";

  /* =================================
     DATA LAYER: the only part that changes when a backend is added
  ================================= */

  // Today: a local JSON file (works on any static host).
  // Later with an API, replace the body with:
  //   const res = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
  //   return res.json();   // and delete the .filter() line
  async function getProducts(category) {
    const res = await fetch("data/products.json");
    if (!res.ok) throw new Error(`Could not load products (${res.status})`);
    const all = await res.json();
    return all.filter((product) => product.categories.includes(category));
  }

  /* =================================
     VIEW LAYER: builds slides from the <template> in the HTML
  ================================= */

  const priceFormat = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  function formatPrice(price) {
    return `INR ${priceFormat.format(price)}`; // 4500 -> "INR 4.5K"
  }

  const template = document.getElementById("product-template");

  function createSlide(product) {
    const slide = template.content.firstElementChild.cloneNode(true);
    const img = slide.querySelector("img");
    img.src = product.image;
    img.alt = product.name;
    // textContent (not innerHTML) keeps backend data from injecting markup
    slide.querySelector(".product-name").textContent = product.name;
    slide.querySelector(".product-price").textContent = formatPrice(
      product.price,
    );
    return slide;
  }

  /* =================================
     PRODUCT CAROUSEL
  ================================= */

  const $track = $(".carousel-track");
  const $status = $(".carousel-status");
  let latestRequest = 0; // ignores slow responses from earlier clicks

  const productSliderOptions = {
    infinite: true,
    slidesToShow: 5,
    slidesToScroll: 3,
    dots: true,
    appendDots: $(".carousel-dots"),
    arrows: true,
    prevArrow: $(".carousel-prev"),
    nextArrow: $(".carousel-next"),
  };

  async function showCategory(category) {
    const requestId = ++latestRequest;

    if ($track.hasClass("slick-initialized")) $track.slick("unslick");
    $track.empty();
    $status.text("Loading…");

    try {
      const products = await getProducts(category);
      if (requestId !== latestRequest) return; // a newer click won

      if (products.length === 0) {
        $status.text("No products in this category yet.");
        return;
      }
      $status.text("");
      $track.append(products.map(createSlide));
      $track.slick(productSliderOptions);
    } catch (error) {
      if (requestId !== latestRequest) return;
      console.error(error);
      $status.text("Could not load products. Please try again.");
    }
  }

  $(".collection-category").on("click", ".btn", function () {
    $(".collection-category .btn")
      .removeClass("active")
      .attr("aria-pressed", "false");
    $(this).addClass("active").attr("aria-pressed", "true");
    showCategory($(this).data("category"));
  });

  // first tab on load
  $(".collection-category .btn").first().trigger("click");

  /* =================================
     TESTIMONIAL CAROUSEL
  ================================= */

  $(".client-carousel").slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 4,
    dots: true,
    appendDots: $(".client-dots"),
    prevArrow: $(".client-prev"),
    nextArrow: $(".client-next"),
  });
})();
