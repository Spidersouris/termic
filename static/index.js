const urlParams = new URLSearchParams(window.location.search);
const searchOptions = document.getElementsByClassName("search-option");
var isLoading = false;
var lengthGlossary = 0
var lengthTm = 0

$(function() {
  const q = urlParams.get("q"); // Query (search term)
  const l = urlParams.get("l"); // Target language
  const o = urlParams.get("o"); // Search option
  const cs = urlParams.get("cs"); // Case sensitive?

  var targetLang = l || $("#target-lang").val();
  var searchOption = o || "exact_match"; // default value
  var resultCountGl = parseInt($("#result-count-glossary").val());
  var resultCountTm = parseInt($("#result-count-tm").val());
  var caseSensitive = cs || 0; // default value
  var modes = ["glossary", "tm"]; // default values

  // Focus search input on page load
  $("#term").focus();

  // Do not use select2 dropdown on mobile devices
  if (!isTouchDevice()) {
    $("#target-lang").select2();
  }

  // --- Beginning of Event Listeners ---
  $(document).on("select2:open", () => {
    document.querySelector(".select2-search__field").focus();
  });

  $(".toggle").on("click", function() {
    // Get the name of the associated dropdown to toggle
    // and item to add/remove from modes list (glossary or TM)
    let mode = this.id.split("-")[1];
    let resultCountDropdown = "#result-count-" + mode;

    if (this.checked) {
      $($(this).data("target")).css("opacity", "1");
      $(resultCountDropdown).prop("disabled", false);
      if (modes.indexOf(mode) === -1) modes.push(mode);
    } else {
      $($(this).data("target")).css("opacity", "0.5"); 
      $(resultCountDropdown).prop("disabled", true);
      modes.splice(modes.indexOf(mode), 1);
    }

    if (!$("#toggle-glossary").is(":checked") && !$("#toggle-tm").is(":checked")) {
      $("#search-btn").prop("disabled", true);
    } else {
      $("#search-btn").prop("disabled", false);
    }

  });

  // Search option handling
  Array.from(searchOptions).forEach(option => {
    $(option).on("click", function() {
      Array.from(searchOptions).forEach(option => {
          option.dataset.active = "inactive";
      });
      this.dataset.active = this.dataset.active == "inactive" ? "active" : "inactive";
      searchOption = this.value;
    });
  });

  // Result count select handling
  $("select").on("change", function() {
    if ($(this).attr("id") == "result-count-glossary") {
      resultCountGl = parseInt($("#result-count-glossary").val());
    } else if ($(this).attr("id") == "result-count-tm") {
      resultCountTm = parseInt($("#result-count-tm").val());
    }
  });

  $("#highlight-btn").on("click", function() {
    highlightResults(this);
  });

  $("#close-error").on("click", function() {
    $("#error-banner").css("display", "none");
  });

  $(".additional-match-option").on("click", function() {
    if ((this.dataset.active == "inactive") && (this.value == "case_sensitivity")) {
      this.dataset.active = "active";
      caseSensitive = 1;
    } else {
      this.dataset.active = "inactive";
      caseSensitive = 0;
    }
  });

  $(".search-option[value='regex']").on("click", function() {
    $(".additional-match-option[value='case_sensitivity']").prop("disabled", true);
    $(".additional-match-option[value='case_sensitivity']").prop("title", "Case Sensitivity is not available for RegExp searches");
  });

  $(".search-option:not([value='regex'])").on("click", function() {
    $(".additional-match-option[value='case_sensitivity']").prop("disabled", false);
    $(".additional-match-option[value='case_sensitivity']").prop("title", "Case Sensitivity");
  });
  // --- End of Event Listeners ---

  if (q) {
    // Update term input box with the value of the q parameter and launch serch
    $("#term").val(q);
    var term = $("#term").val();
    if (!modes || modes.length <= 0) {
      showError("Please select at least one search mode.");
    } else {
      request(term, targetLang, resultCountGl, resultCountTm,
              searchOption, caseSensitive, modes);
    }
  }

  if (l) {
    // Update target language dropdown with the value of the l parameter
    $("#target-lang").val(l);
  }

  if ((o) && (o != "exact_match")) {
    // Update buttons to active
    $(`button[value='exact_match']`).attr("data-active", "inactive");
    $(`button[value='${o}']`).attr("data-active", "active");
  }

  if (cs == 1) {
    // Update case sensitivity button to active
    $(`button[value='case_sensitivity']`).attr("data-active", "active");
  }

  $("#search-form").on("submit", function(e) {
    e.preventDefault();
    if (!modes || modes.length <= 0) {
      showError("Please select at least one search mode.");
    } else {
    if (!isLoading) {
      isLoading = true;
      var term = $("#term").val();
      var targetLang = $("#target-lang").val();
      $("#warning-banner").css("display", "none");
      $("#error-banner").css("display", "none");
      request(term, targetLang, resultCountGl, resultCountTm,
              searchOption, caseSensitive, modes);
    }
  }});
});

/**
 * Request search results from the server
 * @param {string} term - Term to search for
 * @param {string} targetLang - Target language
 * @param {number} resultCountGl - Number of glossary results to return
 * @param {number} resultCountTm - Number of TM results to return
 * @param {string} searchOption - Search option (exact_match, unexact_match, regex)
 * @param {number} caseSensitive - Case sensitivity (0 or 1)
 * @param {Array} modes - Array of modes to search (glossary, tm)
 */
function request(term, targetLang, resultCountGl, resultCountTm,
                searchOption, caseSensitive, modes) {
  $("#target-lang").prop("disabled", true);
  $("#search-btn").prop("disabled", true);
  $("#loader").css("display", "flex");
  $.ajax({
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    url: "/",
    type: "POST",
    dataType: "json",
    data: JSON.stringify({
      term: term,
      target_lang: targetLang,
      result_count_gl: resultCountGl,
      result_count_tm: resultCountTm,
      search_option: searchOption,
      case_sensitive: caseSensitive,
      modes: modes
    }),
    success: function(response) {
      lengthGlossary = Object.values(response)[0].length;
      // select last array for length of TM results
      lengthTm = Object.values(response).slice(-1)[0].length;

      // Update URL
      let params = {q: term, l: targetLang, o: searchOption, cs:caseSensitive};
      let newParams = new URLSearchParams(params);
      const newUrl = window.location.pathname + "?" + newParams.toString();
      window.history.pushState({ path: newUrl }, "", newUrl);

      // Get results
      console.log(Object.values(response))

      switch (true) {
        case $("#toggle-glossary").is(":checked") && !$("#toggle-tm").is(":checked"):
          $("#tm-results").css("display", "none");
          getGlossary(response, lengthGlossary);
          break;
        case !$("#toggle-glossary").is(":checked") && $("#toggle-tm").is(":checked"):
          $("#glossary-results").css("display", "none");
          getExcerpts(response, lengthTm);
          break;
        default:
          getGlossary(response, lengthGlossary);
          getExcerpts(response, lengthTm);
      }

      $("#results").css("display", "block");
      $("#error-banner").css("display", "none");
      $("#loader").css("display", "none");
      document.title =
      `termic :: ${term} (${$("#target-lang option:selected").text()})`;
    },
    error: function(jqXHR, textStatus, errorThrown) {
      $("#error-banner").css("display", "flex");
      $("#error-banner #error-msg").html(textStatus+": "+errorThrown);
      $("#loader").css("display", "none");
    },
    complete: function() { // fix bug that prevents new search
      isLoading = false;
      $("#target-lang").prop("disabled", false);
      $("#search-btn").prop("disabled", false);
      $("#highlight-btn").prop("disabled", false);
      if ((lengthGlossary > 0) || (lengthTm > 0)) {
        activateSortRows();
        return isTouchDevice() ? activateCopyWithTap() : activateCopyWithBtn();
      } else {
        $("#no-results").css("display", "flex");
        $("#glossary-results").css("display", "none");
        $("#tm-results").css("display", "none");
      }
    }
  });
}

/**
 * Get TM results and display them
 * @param {Response} response - Response from server
 * @param {number} length - Number of glossary results
 */
function getGlossary(response, length) {
  if (length > 0) {
    //console.log("Found " + length + " glossary entries");
    $("#glossary-results").css("display", "block");
    let resultsGl = "";
    for (let i = 0; i < length; i++) {
      resultsGl += `
        <tr>
          <td data-attribute="source">${response.gl_source[i]}<br>
            <i>(${response.gl_source_pos[i]
                .substring(response.gl_source_pos[i].indexOf(":") + 1)
                .trim().toLowerCase()})</i>
          </td>

          <td>${response.gl_translation[i]}<br>
            <i>(${response.gl_target_pos[i]
                .substring(response.gl_target_pos[i].indexOf(":") + 1)
                .trim().toLowerCase()})</i>
          </td>

          <td>${response.gl_source_def[i]
              .substring(response.gl_source_def[i].indexOf(":") + 1).trim()}
          </td>

          <td><i class="fa-solid fa-copy"></i></td>
        </tr>
      `;
  }
    $("#glossary-results-table").html(resultsGl);
    $("#glossary-nb").html(` (${length} results)`);
    $("#search-filters-container").css("display", "flex");
  } else {
    $("#glossary-results-table").html("<p>No results found in the glossary.</p>");
    $("#glossary-nb").html(` (0 results)`);
  }
}

/**
 * Get TM results and display them
 * @param {Response} response - Response from server
 * @param {number} length - Number of TM results
 */
function getExcerpts(response, length) {
  if (length > 0) {
    //console.log("Found " + length + " TM entries");
    $("#tm-results").css("display", "block");
    let resultsTm = "";
    for (let i = 0; i < length; i++) {
      resultsTm += `
        <tr>
          <td data-attribute="source">${response.tm_source[i]}</td>
          <td>${response.tm_translation[i]}</td>
          <td>${response.tm_cat[i]}</td>
          <td>${response.tm_platform[i]}</td>
          <td>${response.tm_product[i]}</td>
          <td><i class="fa-solid fa-copy"></i></td>
        </tr>
      `;
  }
    $("#tm-results-table").html(resultsTm);
    $("#tm-nb").html(` (${length} results)`);
    $("#search-filters-container").css("display", "flex");
  } else {
    $("#tm-results-table").html("<p>No results found in the translation memory.</p>");
    $("#tm-nb").html(` (0 results)`);
  }
}

/**
 * Highlight results with mark.js
 * @param {HTMLButtonElement} e - Highlight button
 */
function highlightResults(e) {
  if (e.dataset.active == "inactive") {
    e.dataset.active = "active";
    let keyword = $("#term").val();

    $("td[data-attribute='source']").unmark({
      done: function() {
        $("td[data-attribute='source']").mark(keyword);
      }
    });
  } else {
    $("td[data-attribute='source']").unmark();
    e.dataset.active = "inactive";
  }
}

/**
 * Get row content
 * @param {HTMLTableCellElement} row - Row to get content from
 * @returns {string} - Row content
 */
function getRowContent(row) {
  const cells = Array.from(row.cells);
  const rowContent = cells.map(cell => cell.textContent.trim())
                         .join(" | ")
                         .replace(/\s*\n\s*/g, " ")
                         .slice(0, -3);
  return rowContent;
}

/**
 * Activate copy fezture with button on non-touch devices
 * and devices which width > 480
 */
function activateCopyWithBtn() {
  Array.from(document.getElementsByClassName("fa-copy")).forEach(copyButton => {
    $(copyButton).on("click", function() {
      const rowContent = getRowContent(copyButton.closest("tr"));
      copyToClipboard(rowContent);
      $(copyButton).addClass("copied");
      setTimeout(() => {
        $(copyButton).removeClass("copied");
      }, 2000);
    });
  });
}

/**
 * Activate copy feature with double tap on touch devices
 * and devices which width <= 480
 */
function activateCopyWithTap() {
  let lastTap = 0;
  $(".fa-copy").css("display", "none");
  $("#tip-tap").css("display", "block");
  Array.from(document.querySelectorAll("tbody")).forEach(tbody => {
    $(tbody).on("touchstart", function() {
      e.preventDefault();
      let time = new Date().getTime();
      const tapInterval = 500; // in ms
      if (time - lastTap < tapInterval) {
        const rowContent = getRowContent(e.target.closest("tr"));
        showToast("<p>Row copied</p>");
        copyToClipboard(rowContent);
      }
      lastTap = time;
    });
  });
}

/**
 * Copy row content to clipboard
 * @param {string} text - Row content to copy
 */
function copyToClipboard(text) {
  if (!navigator.clipboard) { // handle deprecated execCommand()
    execCommand("copy", false, text)
    .then(() => console.log("Row content copied to clipboard"))
    .catch(error => console.error("Failed to copy row content: ", error)); 
  } else {
    navigator.clipboard.writeText(text)
    .then(() => console.log("Row content copied to clipboard"))
    .catch(error => console.error("Failed to copy row content: ", error));
  }
}

/**
 * Show toast to mobile users
 * @param {string} text - Text to display in toast
 */
function showToast(text) {
  let toastTimeout = 0;
  $("#toast").html(text);
  $("#toast-container").css("display", "block");
  $("#toast-container").animate({ opacity: 1 }, 500); 
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    $("#toast-container").animate({ opacity: 0 }, 500, () => {
      $("#toast-container").css("display", "none");
    });
  }, 2000);
}

/**
 * Activate sort rows feature
 * Modified from https://stackoverflow.com/questions/3160277/jquery-table-sort
 */
function activateSortRows() {
    $("th").click(function() {
      var table = $(this).parents("table").eq(0);
      var ths = table.find("th");
      var rows = table.find("tr:gt(0)").toArray().sort(comparer($(this).index()));
      this.asc = !this.asc;

      // Clear existing carets
      Array.from(ths).forEach(th => {
        $(th).find(".fa-caret-down").removeClass("caret-force-visible");
        $(th).find(".fa-caret-up").removeClass("caret-force-visible");
      });

      if (!this.asc) {
        rows = rows.reverse();
        $(this).find(".fa-caret-down").addClass("caret-force-visible");
      } else {
        $(this).find(".fa-caret-up").addClass("caret-force-visible");
      }
      for (var i = 0; i < rows.length; i++) {
        {table.append(rows[i])}
  }});

  /**
   * Compare rows
   * @param {number} index - Index of the column to sort by
   * @returns {function} - Comparator function to sort rows by index column
   */
  function comparer(index) {
    return function(a, b) {
        var valA = getCellValue(a, index);
        var valB = getCellValue(b, index);
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB);
    };
  }

  /**
   * Get cell value
   * @param {HTMLTableCellElement} row - Row to get value from
   * @param {number} index - Index of the column to get value from
   * @returns {string}
   */
  function getCellValue(row, index) {
    return $(row).children("td").eq(index).text();
  }
}

/**
 * Check if device is touch-enabled
 * https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
 * @returns {boolean} - true if the device is touch, false otherwise
 */
function isTouchDevice() {
  return ((("ontouchstart" in window) ||
    // temp fix for https://stackoverflow.com/questions/69125308/navigator-maxtouchpoints-256-on-desktop
    (navigator.maxTouchPoints > 0) && (navigator.maxTouchPoints != 256) ||
    // if the screen is >480, there's enough space for the copy button; no need to activate touch mode
    (navigator.msMaxTouchPoints > 0)) && window.screen.width <= 480);
}

/**
 * Show error banner with text
 * @param {string} text - Text to display in error banner
 */
function showError(text) {
  $("#error-banner").css("display", "flex");
  $("#error-banner #error-msg").html(text);
}