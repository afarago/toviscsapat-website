(function(){
// Self-Executing Anonymous Function

// ================================================================================================
// -- actions after doc ready
$(function() { 

  //-- disabled nav anchors
  $("a.disablenav").click(function(event){
    event.preventDefault()
  });

  //-- highlight selected nav
  highlightSelectedNav()

  // add navbar collapse on submenus
  //TODO: on hashchange/popstate/nevigation
  $('.navbar-nav>li>a:not(.dropdown-toggle)').on('click', function(){
      $('.navbar-collapse').collapse('hide');
      highlightSelectedNav();
  });

  //-- add easter egg handlers
  addEasterEggHandlers();
  
  //-- set SPA handlers
  setSPAHandlersOnStartup();
  
  //-- dropdown on hover
  //$(".dropdown-toggle").hover(function(){$(this).parent().find(".dropdown-menu").toggleClass('show'), $(".dropdown-toggle").parent(".dropdown").toggleClass('show');})
  
  //-- add backstretch
  $.backstretch([
      "img/photo_back0.jpg"
    , "img/photo_back1.jpg"
    , "img/photo_back2.jpg"
    , "img/photo_back3.jpg"
    , "img/photo_back4.jpg"
    , "img/photo_back5.jpg"
    , "img/photo_back6.jpg"
    , "img/photo_back7.jpg"
    , "img/photo_back8.jpg"
  ], {duration: 5000, fade: 750});
})

// ================================================================================================
// -- Single Page App - load page functions

const i18n_en = { 
  'years': {
    'hely': 'place',
    'Összesített': 'Overall',
    'összesített': 'overall',
    'Regionális': 'Regional',
    'Kutatás': 'Research',
    'Innováció': 'Innovation',
    'Nemzeti döntő': 'National finals',
    'Robotjáték': 'Robot game',
    'Alapértékek': 'Core Values',
    'pont': 'points',
    'Bajnok': 'Champion',
    'csapat': 'team'
  },
};


let loadedpage = null;
let preferredLanguageHU = true;
let isEN, isHU;

// -- in case of missing helper (var) -- simply show the var name --> defaulting for HU
Handlebars.registerHelper('helperMissing', function( /* dynamic arguments */) {
  var options = arguments[arguments.length-1];
  var args = Array.prototype.slice.call(arguments, 0, arguments.length-1)
  return new Handlebars.SafeString(options.name+(arguments.length>1?"("+args+")":''))
})
Handlebars.registerHelper("T", function(textHU, textEN) {
  let value = isHU ? textHU : textEN;
  return new Handlebars.SafeString(value);
});

function loadPage(options) {
  //options: page,mark,skipScroll,stateHandling,title

  function _updateHeader(isIndexPage) {
    $("#header").toggleClass("subpage",!isIndexPage).toggleClass("indexpage",isIndexPage);
  }  

  //-- set language "forced", when it is obvious that there is a clear setting 
  let hasPageLanguageExtension = false;
  if (options.page.endsWith("+en")) {
    preferredLanguageHU = false;
    hasPageLanguageExtension = true;
  } else if (options.page == "index") {
    preferredLanguageHU = true;
  }
  isEN = !preferredLanguageHU; isHU = !isEN;

  //-- if preferred language is EN, but the page title is not -> append language extension +en
  if (!preferredLanguageHU && !hasPageLanguageExtension) {
    options.page = options.page + "+en";
    hasPageLanguageExtension = true;
  }

  //-- define AJAX utility functions - 404 page error loading 
  let fnLoadError404Page = function() {
      $.get("pages/404.html").then(function(data){
        loadedpage = null;
        $mainContent.html(data); 
        setSPAHandlers($("#mainContent"));
        
        $('html, body').scrollTop(0);
        _updateHeader(false);
      })
  };

  //-- define AJAX utility functions - load page success callback
  let fnLoadPageSuccess = function(data, textStatus, jqXHR) {
    let page_i18n = options.page;
    if (hasPageLanguageExtension) {
      let page_base = options.page.replace("+en","");
      page_i18n = page_base;  
    }

    //-- set i18n values - if exists for page
    let i18n_loadedpage_values = {};
    if (i18n_en[page_i18n]) {
      const i18n_loadedpage = i18n_en[page_i18n];
      i18n_loadedpage_values = Object.assign({}, i18n_loadedpage);
      if (isHU) {
        $.each(i18n_loadedpage, function(i,n) { i18n_loadedpage_values[i]=i; })
      } else if (isEN) { 
        i18n_loadedpage_values = i18n_loadedpage;
      }
    }

    //-- Handlebars values for i18n
    i18n_loadedpage_values['isHU'] = isHU; 
    i18n_loadedpage_values['isEN'] = isEN; 
    data = Handlebars.compile(data)(
      i18n_loadedpage_values
    );
    
    //-- set content
    $mainContent.html(data);
    setSPAHandlers($("#mainContent"));
    loadedpage = options.page;

    $('html, body').scrollTop(0);
    options.skipScroll = true;
    loadPage(options);
  } 

  //-- if fragment is not loaded, load it async to mainContent
  let $mainContent = $("#mainContent"); 
  if (loadedpage !== options.page) {
    let urlToLoad = "pages/"+options.page+".html";
    $.get(urlToLoad)
    .done(function(data, textStatus, jqXHR) {
      fnLoadPageSuccess(data, textStatus, jqXHR);

    }).fail(function(data, textStatus, jqXHR) {

      //-- if there is a language extension like +en, and it is not found 
      //--  then try loading the page in default, as it might have a moustache i18 mode {{#if isHU}}{{/if}} 
      if (hasPageLanguageExtension) {
        let page_base = options.page.replace("+en","");
        urlToLoad = "pages/"+page_base+".html";
        $.get(urlToLoad)
        .done(function(data, textStatus, jqXHR) {
          fnLoadPageSuccess(data, textStatus, jqXHR);
        }).fail(function(data, textStatus, jqXHR) {
          fnLoadError404Page();
        });
      } else {
        fnLoadError404Page();
      }

    });
    return;
  }

  //-- apply language  
  $('.en_only').toggleClass('d-none',!isEN);
  $('.hu_only').toggleClass('d-none',!isHU);

  //-- push state, change browser url
  let localurl = location.pathname+"#"+options.page+(options.mark?"#"+options.mark:'');
  let url = location.protocol+"//"+location.host+localurl;
  if (options.stateHandling=='replace') {history.replaceState({page:options.page, mark:options.mark}, localurl, url)}
  else if (options.stateHandling=='skip') {}
  else {history.pushState({page:options.page, mark:options.mark}, localurl, url)};  
  highlightSelectedNav();
  
  //-- set title
  if (options.title) { document.title = options.title + " - TövisCsapat"; }

  //-- change header div
  let isIndexPage = options.page.startsWith('index');
  _updateHeader(isIndexPage);
  
  //-- change navbar
  let isKezikonyv = options.page=='kezikonyv';
  let navDiv = isKezikonyv?"#nav_kezikonyv":"#nav_main";
  $("#mainNav div#navbarResponsive>ul").addClass('hidden');
  $("#mainNav ul"+navDiv).removeClass('hidden');
  let $navdescription = $("#mainNav .navbar-brand .brand-description");
  $navdescription.toggleClass('d-lg-none', isKezikonyv);
  
  //-- update ga
  gtag('config', 'UA-117926566-1', {
    'page_title' : document.title, //TODO: IE
    'page_path': '/'+localurl
  });
  
  //-- scroll to mark anchor (fix: Edge doesn't support scrollIntoView)
  if (options.mark) {
    let $anchor = $('#' + options.mark);
    if ($anchor.length>0) {
      if (!options.skipScroll || !$anchor[0].scrollIntoView) {
        let newPosition = $anchor.is(':first-of-type') ? 0 : $anchor.offset().top;
        $('html, body').animate({scrollTop:newPosition}, 1500, 'easeInOutQuart');
      } else {
        setTimeout(function() {
          if ($anchor[0].scrollIntoView) $anchor[0].scrollIntoView();
          $('html, body').animate({scrollTop:"-=40"}, 0 );
        }, 300);
      }
    }
  }
  
  //-- call fnloaded function
  if ($.spa && $.spa.fnloaded) {
    try {
      $.spa.fnloaded();
    } catch(err) { }
  }
  
  //-- animate on scroll re/init
  if (AOS) {
    AOS.init();
  }
};

//-- set event handler for all links for SPA
function setSPAHandlers($div) {
  $("a[data-spa-trigger]", $div).on("click", function(event){
    let full_page = $(this).attr("href");
    let title = $(this).data("title");
    let parts = full_page.split("#"), page = parts[1], mark = parts[2];

    event.preventDefault();
    loadPage({page:page,mark:mark,title:title});
  });
}

//-- set event handler for all nav links for SPA
function setSPAHandlersOnStartup() {
  setSPAHandlers($("#mainNav"));

  //-- start with appropriate page - deep linking upon page load / url hash escaping
  var parts = location.hash.replace("%23","#").split("#");
  var page = parts.length>1?parts[1]:"index";
  let mark = parts[2];
  loadPage({page:page, mark:mark, stateHandling:'replace'});
  if (page?.startsWith("index") && mark?.startsWith("research")) { $("#"+mark).click(); } // excaption - drop down research

  //-- back navigation from history - skip inner navigation
  $(window).on("popstate", function(e) {
    let state = e.originalEvent.state;
    if (!state) return;
    loadPage({page:state.page, mark:state.mark, stateHandling:'skip'});
  });
}
//TODO: set page title // pages list with their titles
//TODO: analytics set page


// ================================================================================================
// -- MISC UTILS

// ================================================================================================
// highlightSelectedNav
function highlightSelectedNav() {
    let current = (location.hash=="#"?"#index":location.hash);
    $(".navbar-nav>li").removeClass('active');
    $('#nav_container li a[data-page]').each(function(){
        var $this = $(this);
        //debugger;
        // if the current path is like this link, make it active
        if(current.indexOf('#'+$this.data('page')) !== -1){
            $this.parent().addClass('active');
            $this.parent().parents("li.dropdown").addClass('active');
        }
    })
}

// -- add lightbox trigger - set up once, apply on any subsequent
$(document).on('click', '[data-toggle="lightbox"]', function(event) {
  if ($(this).attr('data-remote')===undefined && $(this).attr('href')===undefined)
    $(this).attr('data-remote', $(this).attr('src'));

  event.preventDefault();
  event.stopPropagation()
  $(this).ekkoLightbox();
});

// -- easter egg: animate nav logo
// -- easter egg: animate indexpage logo
function addEasterEggHandlers() {
  let semaLogo1Running = false;
  // $(".menulogo").click( function() {
      // if (semaLogo1Running) return;
      // semaLogo1Running = true;

      // $logo = $(".menulogo"); 
      // if ($logo.css('position')!='absolute') return;
      // $logo.attr('src','img/legoface.svg');

      // var animarray = [];
      // var newLeft = $(".navbar-nav .nav-item:first-child")[0].getBoundingClientRect().x-44;
      // var oldLeft = $logo[0].getBoundingClientRect().x;
      // animarray.push({left: newLeft});
      // animarray.push({left: oldLeft});

      // $logo.animate(animarray[0], 2000, "easeOutBounce",
        // function() {
          // $logo.animate(animarray[1], 2000, "easeOutBounce", function() { 
            // $logo.attr('src','img/legoface_anim.svg');
            // semaLogo1Running = false;
          // } );
        // });
    // });
    
  $(".logo-legoface img, .menulogo").click( function() {
    let $logo1 = $(this);
    if ($logo1.data('animating')) return;
    $logo1.data('animating', true);

    let src_orig = $logo1.attr('src');
    let src_anim = $logo1.data('anim_src');
    if (src_anim) $logo1.attr('src',src_anim);
    var transformRot = (Math.floor((Math.random() * 2) + 1) == 1 ? 'rotateX' : 'rotateY');
    $logo1.animate({deg:"+=360"}, 
      { 
        duration: 2000,
        step: function(now) {
          $logo1.css({transform: transformRot + '(' + now + 'deg)'});
        },
        complete: function() {
          $logo1.attr('src',src_origT);
          $logo1.data('animating', null);
        }
      });
    });
};

})();

//-- add main object to global namespace
$.spa = { fncallback: null };