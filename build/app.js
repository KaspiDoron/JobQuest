"strict mode";

// const { doc } = require("prettier");

class App {
  constructor() {
    this.uiManager = new UIManager(this);
    this.jobManager = new JobManager(this);
    this.categoryManager = new CategoryManager(this);
    this.filterManager = new FilterManager(this);
    this.errorMessages = {
      // Job-related errors
      fetchingJobs: {
        type: "jobs",
        message: "Unable to load jobs. Please try refreshing the page.",
      },
      jobCountInvalid: {
        type: "jobCount",
        message: "Please enter a number between 1 and 30",
      },

      // Search-related errors
      searchBarError: {
        type: "searchBar",
        message: "No matchings found. Try other keywords.",
      },

      // Chip-related errors
      fetchingChips: {
        type: "chips",
        message: "Unable to load categories. Please try refreshing.",
      },

      // Filter-related errors
      fetchingCategories: {
        type: "filters",
        message: "Unable to load filters. Please try refreshing.",
      },

      // General page errors
      initialize: {
        type: "page",
        message: "Something went wrong. Please refresh the page.",
      },

      handleSearchingEvent: {
        type: "page",
        message: "Something went wrong. Please refresh the page.",
      },

      // Storage-related errors
      gettingSeenJobs: {
        type: "storage",
        message: "Unable to load your seen jobs.",
      },
      gettingFavorites: {
        type: "storage",
        message: "Unable to load your favorite filters.",
      },
      // Add new error type for advanced search
      searchNotFound: {
        type: "searchBar",
        message: "No results found. Try different keywords.",
      },
    };

    this.successMessages = {
      searchSuccess: {
        type: "searchBar",
        message: "Found matching jobs!",
        visualFeedback: {
          classes: [
            "ring-8",
            "ring-emerald-500",
            "text-emerald-600",
            "dark:ring-emerald-400",
            "dark:text-emerald-400",
            "focus:ring-8",
            "focus:ring-emerald-500",
            "focus:text-emerald-600",
            "focus:dark:ring-emerald-400",
            "focus:dark:text-emerald-400",
          ],
          duration: 2000,
        },
      },
    };
    this.IDs = {
      job: [],
      filter: [],
      category: [],
      chip: [],
    };
  }

  async initializeApp() {
    try {
      const chipPromise = await this.categoryManager.fetchChips();

      const filterKey = "category";
      const filterValue = this.categoryManager.randomCategory();

      const promises = Promise.all([
        Promise.resolve(chipPromise),
        this.categoryManager.fetchCategories(),
        this.jobManager.fetchJobs("init", filterKey, filterValue),
      ]);

      this.jobManager.seenJobs;
      this.filterManager.getFavFilters();

      const [chips, categories, jobs] =
        await this.uiManager.uiLoading.loadingManagerInit(promises);

      this.uiManager.uiRendering.renderFavFilters(
        this.filterManager.favoriteFilters
      );

      this.jobManager.jobsDisplayed = jobs;
      console.log("The Jobs Displayed Are:", this.jobManager.jobsDisplayed);

      this.uiManager.uiTheme.initializeTheme();
      this.uiManager.updateUI(
        jobs,
        categories,
        chips,
        "_",
        filterKey,
        filterValue
      );
    } catch (error) {
      this.handleError("initialize", error.code, error.message);
    }
  }

  async handleSearchingEvent(
    eventTarget,
    source,
    filterKey,
    filterValue,
    id,
    isActive,
    directJobs = null
  ) {
    try {
      // Handle direct jobs from advanced search
      if (directJobs) {
        this.jobManager.jobsDisplayed = directJobs;
        this.uiManager.updateUI(
          directJobs,
          null,
          null,
          null,
          filterKey,
          filterValue,
          "replace"
        );
        this.uiManager.displaySuccess(this.successMessages.searchSuccess);
        return directJobs;
      }

      // Check if filter is already active
      const isFilterActive = this.filterManager.isActiveFilter(
        filterKey,
        filterValue
      );
      console.log("Filter active status:", isFilterActive);

      // Update UI based on filter state
      this.uiManager.updateUISelected(eventTarget, source, isFilterActive);

      const isLastFilter =
        this.filterManager.activeFilters.length === 1 && isFilterActive;

      if (this.filterManager.activeFilters.length === 0 && !isFilterActive) {
        await this.handleNoActiveFilters(
          source,
          filterKey,
          filterValue,
          id,
          isFilterActive,
          eventTarget
        );
      } else if (isLastFilter) {
        await this.handleSingleActiveFilter(
          source,
          filterKey,
          filterValue,
          id,
          isFilterActive,
          eventTarget
        );
      } else if (isFilterActive) {
        await this.handleRemoveActiveFilter(
          source,
          filterKey,
          filterValue,
          id,
          isFilterActive,
          eventTarget
        );
      } else {
        await this.handleAddNewFilter(
          source,
          filterKey,
          filterValue,
          id,
          isFilterActive,
          eventTarget
        );
      }

      return this.jobManager.jobsDisplayed;
    } catch (error) {
      this.handleError("handleSearchingEvent", error.code, error.message);
    }
  }

  async handleNoActiveFilters(
    source,
    filterKey,
    filterValue,
    id,
    isActive,
    eventTarget
  ) {
    console.log("Entering the handleNoActiveFilters method");
    this.jobManager.jobsDisplayed = [];
    const jobs = await this.fetchAndDisplayJobs(source, filterKey, filterValue);
    this.filterManager.toggleActiveFilter(
      eventTarget,
      id,
      filterKey,
      filterValue,
      isActive
    );
    this.jobManager.jobsDisplayed.push(...jobs);
    console.log("The Jobs Displayed Are:", this.jobManager.jobsDisplayed);
    this.uiManager.updateUI(
      jobs,
      null,
      null,
      null,
      filterKey,
      filterValue,
      "replace"
    );
  }

  async handleSingleActiveFilter(
    source,
    filterKey,
    filterValue,
    id,
    isActive,
    eventTarget
  ) {
    console.log("Entering the handleSingleActiveFilter method");
    this.jobManager.jobsDisplayed = [];
    const randomCategory = this.categoryManager.randomCategory();
    const jobsRandom = await this.fetchAndDisplayJobs(
      source,
      "category",
      randomCategory
    );
    this.filterManager.toggleActiveFilter(
      eventTarget,
      id,
      "category",
      randomCategory,
      isActive
    );
    this.jobManager.jobsRandom = jobsRandom;
    this.uiManager.updateUI(
      jobsRandom,
      null,
      null,
      null,
      "category",
      randomCategory,
      "replace"
    );
  }

  async handleRemoveActiveFilter(
    source,
    filterKey,
    filterValue,
    id,
    isActive,
    eventTarget
  ) {
    console.log("Entering the handleRemoveActiveFilter method");
    const displayedJobs = this.jobManager.removeActiveFiltersJobs(
      filterKey,
      filterValue
    );

    this.filterManager.toggleActiveFilter(
      eventTarget,
      id,
      filterKey,
      filterValue,
      isActive
    );

    this.uiManager.updateUI(
      displayedJobs,
      null,
      null,
      null,
      null,
      null,
      "display"
    );
  }

  async handleAddNewFilter(
    source,
    filterKey,
    filterValue,
    id,
    isActive,
    eventTarget
  ) {
    const jobs = await this.fetchAndDisplayJobs(source, filterKey, filterValue);
    this.jobManager.jobsDisplayed.push(...jobs);
    this.uiManager.updateUI(
      jobs,
      null,
      null,
      null,
      filterKey,
      filterValue,
      "adding"
    );
    this.filterManager.toggleActiveFilter(
      eventTarget,
      id,
      filterKey,
      filterValue,
      isActive
    );
  }

  async fetchAndDisplayJobs(source, filterKey, filterValue) {
    return await this.uiManager.uiLoading.loadingManagerSearch(
      this.jobManager.fetchJobs(
        source,
        filterKey,
        filterValue,
        this.uiManager.uiBinding.jobCount.value
          ? this.uiManager.uiBinding.isJobCountValid(
              this.uiManager.uiBinding.jobCount.value
            )
          : 15
      )
    );
  }

  handleError(errorEvent, code, msg) {
    console.error(`Error: ${errorEvent}, Code: ${code}, Message: ${msg}`);

    const errorConfig = this.errorMessages[errorEvent];
    if (!errorConfig) {
      console.warn("Unknown error type:", errorEvent);
      return;
    }

    this.uiManager.displayError(errorConfig);
    console.log("Error Config, Error Event:", errorConfig, errorEvent);
  }

  clearLocalStorage(target) {
    target ? localStorage.removeItem(target) : localStorage.clear();
  }
}

/*****************************************************************************************/
/*****************************************************************************************/
/*****************************************************************************************/

class UIManager {
  constructor(appIns) {
    this.app = appIns;
    this.uiRendering = new UIRendering(this);
    this.uiBinding = new UIBinding(this);
    this.uiOverlay = new UIOverlay(this);
    this.uiLoading = new UILoading(this);
    this.uiTheme = new UITheme(this);
  }

  idManager(target, jobOrChip = null) {
    if (["job", "chip"].includes(target)) {
      if (!this.app.IDs[target].includes(jobOrChip.id)) {
        this.app.IDs[target].push(jobOrChip.id);
        // console.log(`The current IDs of ${target} are:`, this.app.IDs[target]);
      } else {
        // console.log(
        //   `The ID already exists in ${target} IDs:`,
        //   this.app.IDs[target]
        // );
      }
      return jobOrChip.id;
    }

    let randomId;
    do {
      randomId = Math.floor(Math.random() * Math.random() * 10000);
    } while (
      this.app.IDs[target].some((filter) => filter.IdFilter === randomId)
    );
    this.app.IDs[target].push(randomId);
    // console.log(`The current IDs of ${target} are:`, this.app.IDs[target]);
    return randomId;
  }

  displayError(errorConfig) {
    switch (errorConfig.type) {
      case "jobs":
        this.uiBinding.jobContainer.innerHTML = `
          <div class="w-full rounded-3xl bg-amber-2 dark:bg-slate-11 p-6 text-center">
            <div class="flex flex-col items-center gap-3">
              <ion-icon name="alert-circle-outline" class="text-4xl text-rose-500 dark:text-pink-500"></ion-icon>
              <p class="text-sm font-serif3 text-rose-700 dark:text-pink-400">${errorConfig.message}</p>
              <button onclick="window.location.reload()" class="mt-2 px-4 py-2 text-xs bg-amber-11 text-slate-1 rounded-full hover:bg-amber-10 transition-colors duration-fast">
                Refresh Page
              </button>
            </div>
          </div>`;
        break;

      case "searchBar":
        console.log("The Error Config is:", errorConfig);

        const searchBar = this.uiBinding.searchBarSearch;
        console.log("The Search Bar is:", searchBar);

        searchBar.classList.add(
          "ring-8",
          "ring-rose-500",
          "text-rose-500",
          "dark:ring-pink-500",
          "dark:text-pink-500",
          "text-lighter",
          "focus:ring-8",
          "focus:ring-rose-500",
          "focus:text-rose-500",
          "focus:dark:ring-pink-500",
          "focus:dark:text-pink-500",
          "focus:text-lighter"
        );
        searchBar.value = errorConfig.message;
        setTimeout(() => {
          searchBar.classList.remove(
            "ring-8",
            "ring-rose-500",
            "text-rose-500",
            "dark:ring-pink-500",
            "dark:text-pink-500",
            "text-lighter",
            "focus:ring-8",
            "focus:ring-rose-500",
            "focus:text-rose-500",
            "focus:dark:ring-pink-500",
            "focus:dark:text-pink-500",
            "focus:text-lighter"
          );
          searchBar.value = "";
        }, 3000);
        break;

      case "chips":
        this.uiBinding.chipsContainer.innerHTML = `
          <div class="w-full p-4 text-center">
            <p class="text-xs font-serif3 text-rose-600 dark:text-pink-400">
              ${errorConfig.message}
            </p>
          </div>`;
        break;

      case "jobCount":
        const alert = this.uiBinding.jobCountAlert;
        alert.textContent = errorConfig.message;
        alert.classList.remove("hidden");
        alert.classList.add(
          "text-rose-600",
          "dark:text-pink-400",
          "text-xs",
          "font-serif3"
        );
        setTimeout(() => alert.classList.add("hidden"), 3000);
        break;

      case "page":
        // Create full-page overlay error
        const overlay = document.createElement("div");
        overlay.className = `fixed inset-0 bg-amber-1 dark:bg-slate-9 bg-opacity-95 dark:bg-opacity-95 
          flex items-center justify-center z-50`;
        overlay.innerHTML = `
          <div class="text-center p-6 rounded-xl max-w-md">
            <ion-icon name="warning-outline" class="text-6xl text-rose-500 dark:text-pink-500 mb-4"></ion-icon>
            <p class="leading-[3rem] text-base font-serif3 text-rose-700 dark:text-pink-400 mb-6">${errorConfig.message}</p>
            <button onclick="window.location.reload()" 
              class="px-6 py-3 bg-amber-11 text-slate-1 rounded-full hover:bg-amber-10 
              transition-colors duration-fast text-sm font-serif3">
              Refresh Page
            </button>
          </div>`;
        document.body.appendChild(overlay);
        break;

      default:
        console.warn("Unhandled error type:", errorConfig.type);
    }
  }

  // Display success message method
  displaySuccess(successConfig) {
    switch (successConfig.type) {
      case "searchBar":
        const searchBar = this.uiBinding.searchBarSearch;
        searchBar.classList.add(...successConfig.visualFeedback.classes);
        searchBar.value = successConfig.message;
        setTimeout(() => {
          searchBar.classList.remove(...successConfig.visualFeedback.classes);
          searchBar.value = "";
        }, successConfig.visualFeedback.duration);
        break;
    }
  }

  favoriteFiltersUI(favFilters) {
    // Update the UI with latest favorite filters
    this.uiRendering.renderFavFilters(this.app.filterManager.favoriteFilters);
  }

  seenJobsUI(seenJob, addRemove, eventTarget) {
    switch (addRemove) {
      case "remove":
        eventTarget.setAttribute("name", "eye-outline");
        break;

      case "add":
        eventTarget.setAttribute("name", "eye-off-outline");
        break;
    }
    console.log(eventTarget);
  }

  updateUI(
    jobs,
    categories,
    chips,
    filter,
    filterKey,
    filterValue,
    addingOrReplaceOrDisplay
  ) {
    jobs
      ? this.uiRendering.renderJobs(
          jobs,
          filterKey,
          filterValue,
          addingOrReplaceOrDisplay
        )
      : null;

    categories ? this.uiRendering.renderFilters(categories) : null;

    chips ? this.uiRendering.renderChips(chips) : null;
  }

  updateUISelected(eventTarget, source, isActive) {
    const activeClass = "ACTIVE";

    switch (source) {
      case "chip":
        if (!isActive) {
          eventTarget.classList = `
            chip whitespace-nowrap max-w-min font-lighter opacity-100 
            laptop:px-3 laptop:py-2 px-2 py-1 rounded-xl 
            dark:bg-slate-3 bg-amber-3 text-[1rem] 
            laptop:text-sm laptop:font-lighter cursor-pointer 
            hover:opacity-100 transition-all duration-fast 
            hover:bg-amber-4 dark:hover:bg-slate-4 
            dark:text-slate-11 ${activeClass}`;
        } else {
          eventTarget.classList = `
            chip whitespace-nowrap max-w-min font-lighter 
            opacity-80 laptop:px-3 laptop:py-2 px-2 py-1 
            rounded-xl dark:bg-slate-10 bg-[#F0E8DB] 
            text-[1rem] laptop:text-sm laptop:font-lighter 
            cursor-pointer hover:opacity-100 transition-all 
            duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-11`;
        }
        break;

      case "filter":
        if (!isActive) {
          eventTarget.classList = `
            filter-btn inline-flex items-center gap-3 
            cursor-pointer group w-fit px-3 py-2 rounded-2xl 
            bg-amber-3 dark:bg-slate-11 transition-all 
            duration-fast text-slate-6 ${activeClass}`;
        } else {
          eventTarget.classList = `
            filter-btn inline-flex items-center gap-3 
            cursor-pointer group w-fit px-3 py-2 rounded-2xl 
            hover:bg-amber-2 dark:hover:bg-slate-11 
            transition-all duration-fast`;
        }
        break;

      case "searchbar":
        // No UI changes needed for searchbar
        break;
    }
  }
}

class UIRendering {
  constructor(UIManagerIns) {
    this.uiManager = UIManagerIns;
  }

  renderJobs(jobs, filterKey, filterValue, addingOrReplaceOrDisplay) {
    console.log("addingOrReplaceOrDisplay:", addingOrReplaceOrDisplay);
    if (!Array.isArray(jobs)) {
      console.error("No jobs array provided");
      return;
    }

    if (addingOrReplaceOrDisplay === "replace") {
      this.uiManager.uiBinding.jobContainer.innerHTML = "";
      jobs.forEach((job) => {
        const [tag1, tag2, tag3, tag4] = job.tags;

        const HTML = `
            <div
              class="job tablet:text-xxs text-[0.9rem] min-w-fit rounded-3xl tablet:rounded-[10rem] bg-amber-2 dark:bg-slate-11 px-6 py-3 pl-3 border-2 border-slate-3 backdrop-opacity-60 shadow-[0_0_0.2rem_0_rgba(0,0,0,0.1)] dark:border-opacity-40 max-h-fit leading-6 flex items-center justify-center transition-all duration-fast hover:bg-amber-3 dark:hover:bg-slate-9"
              id="${job.idJob}"
              data-filterkey="${job.filterKey}"
              data-filtervalue="${job.filterValue}"
            >
              <div
                class="grid tablet:grid-cols-[fit-content(100%)_1fr_fit-content(100%)] grid-cols-[fit-content(100%)_1fr] grid-rows-[1fr_fit-content(100%)] tablet:grid-rows-none items-center min-w-full gap-3 tablet:py-3 gap-y-1 cursor-pointer group"
                onclick="window.location.href='${job.jobUrl}';"
              >
                <img
                  src="${job.companyLogo}"
                  alt=${job.company}"
                  class="rounded-full h-6 min-w-max"
                />
                <div
                  class="flex flex-col justify-center gap-1 tablet:gap-2 font-normal"
                >
                  <div
                    class="flex flex-col tablet:flex-row tablet:items-center tablet:gap-2 text-[0.95rem] tablet:whitespace-nowrap items-start gap-[0.2rem]"
                  >
                    <h4>${job.title}</h4>
                    <h4 class="hidden tablet:block">✦</h4>
                    <h4 class="opacity-70 text-[0.9rem]">${job.company}</h4>
                  </div>

                  <div class="flex flex-wrap justify-start gap-2 text-[1rem]">
                  <span
                    class="${job.salary ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${job.salary || ""}</span>
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                    >
                      ${job.jobFormat.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span
                    >
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                      >${job.location}</span
                    >
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                      >${job.filterValue.replace(/\b\w/g, (c) => c.toUpperCase())}</span
                    >
                  <span
                    class="${tag1 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag1?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag2 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag2?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag3 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag3?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag4 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag4?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  </div>
                </div>
                <div
                  class="flex gap-2 items-center justify-center col-[_1_/_3] tablet:col-auto mt-2 tablet:mt-0 tablet:invisible tablet:group-hover:visible"
                >
                  <a
                    href="${job.jobUrl}"
                    class="px-2 py-1 tablet:px-3 tablet:py-2 rounded-3xl bg-amber-11 text-slate-1 hover:bg-amber-10 duration-fast transition-all drop-shadow-sm tablet:text-[1rem] hover:ring-4 ring-slate-2 ring-opacity-80"
                    >Apply</a
                  >
                  <ion-icon
                    name="eye-outline"
                    class="seen-job-btn text-base hover:scale-125 duration-fast transition-all cursor-pointer"
                    role="button"
                  ></ion-icon>
                </div>
              </div>
            </div>
              `;
        this.uiManager.uiBinding.jobContainer.innerHTML =
          HTML + this.uiManager.uiBinding.jobContainer.innerHTML;
      });
    } else if (addingOrReplaceOrDisplay === "display") {
      this.uiManager.uiBinding.jobContainer.innerHTML = "";
      jobs.forEach((job) => {
        const [tag1, tag2, tag3, tag4] = job.tags;

        const HTML = `
            <div
              class="job tablet:text-xxs text-[0.9rem] min-w-fit rounded-3xl tablet:rounded-[10rem] bg-amber-2 dark:bg-slate-11 px-6 py-3 pl-3 border-2 border-slate-3 backdrop-opacity-60 shadow-[0_0_0.2rem_0_rgba(0,0,0,0.1)] dark:border-opacity-40 max-h-fit leading-6 flex items-center justify-center transition-all duration-fast hover:bg-amber-3 dark:hover:bg-slate-9"
              id="${job.idJob}"
              data-filterkey="${job.filterKey}"
              data-filtervalue="${job.filterValue}"
            >
              <div
                class="grid tablet:grid-cols-[fit-content(100%)_1fr_fit-content(100%)] grid-cols-[fit-content(100%)_1fr] grid-rows-[1fr_fit-content(100%)] tablet:grid-rows-none items-center min-w-full gap-3 tablet:py-3 gap-y-1 cursor-pointer group"
                onclick="window.location.href='${job.jobUrl}';"
              >
                <img
                  src="${job.companyLogo}"
                  alt=${job.company}"
                  class="rounded-full h-6 min-w-max"
                />
                <div
                  class="flex flex-col justify-center gap-1 tablet:gap-2 font-normal"
                >
                  <div
                    class="flex flex-col tablet:flex-row tablet:items-center tablet:gap-2 text-[0.95rem] tablet:whitespace-nowrap items-start gap-[0.2rem]"
                  >
                    <h4>${job.title}</h4>
                    <h4 class="hidden tablet:block">✦</h4>
                    <h4 class="opacity-70 text-[0.9rem]">${job.company}</h4>
                  </div>

                  <div class="flex flex-wrap justify-start gap-2 text-[1rem]">
                  <span
                    class="${job.salary ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${job.salary || ""}</span>
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                    >
                      ${job.jobFormat.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span
                    >
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                      >${job.location}</span
                    >
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                      >${job.filterValue.replace(/\b\w/g, (c) => c.toUpperCase())}</span
                    >
                  <span
                    class="${tag1 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag1?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag2 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag2?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag3 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag3?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag4 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag4?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  </div>
                </div>
                <div
                  class="flex gap-2 items-center justify-center col-[_1_/_3] tablet:col-auto mt-2 tablet:mt-0 tablet:invisible tablet:group-hover:visible"
                >
                  <a
                    href="${job.jobUrl}"
                    class="px-2 py-1 tablet:px-3 tablet:py-2 rounded-3xl bg-amber-11 text-slate-1 hover:bg-amber-10 duration-fast transition-all drop-shadow-sm tablet:text-[1rem] hover:ring-4 ring-slate-2 ring-opacity-80"
                    >Apply</a
                  >
                  <ion-icon
                    name="eye-outline"
                    class="seen-job-btn text-base hover:scale-125 duration-fast transition-all cursor-pointer"
                    role="button"
                  ></ion-icon>
                </div>
              </div>
            </div>
              `;
        this.uiManager.uiBinding.jobContainer.innerHTML =
          HTML + this.uiManager.uiBinding.jobContainer.innerHTML;
      });
    } else if (addingOrReplaceOrDisplay === "seenJobs") {
      this.uiManager.uiBinding.jobContainer.innerHTML = "";
      console.log("The Jobs are:", jobs);

      jobs.forEach((job) => {
        try {
          console.log("The Job is:", job);
          const tags = job.tags || [];
          console.log("The Tags are:", tags);
          const tagElements = tags
            .map((tag) =>
              tag
                ? `
            <span class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2">
              ${tag.replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          `
                : ""
            )
            .join("");

          const HTML = `
            <div class="job tablet:text-xxs text-[0.9rem] min-w-fit rounded-3xl tablet:rounded-[10rem] bg-amber-2 dark:bg-slate-11 px-6 py-3 pl-3 border-2 border-slate-3 backdrop-opacity-60 shadow-[0_0_0.2rem_0_rgba(0,0,0,0.1)] dark:border-opacity-40 max-h-fit leading-6 flex items-center justify-center transition-all duration-fast hover:bg-amber-3 dark:hover:bg-slate-9"
              id="${job.idJob}"
              data-filterkey="${job.filterKey || ""}"
              data-filtervalue="${job.filterValue || ""}"
            >
              <div class="grid tablet:grid-cols-[fit-content(100%)_1fr_fit-content(100%)] grid-cols-[fit-content(100%)_1fr] grid-rows-[1fr_fit-content(100%)] tablet:grid-rows-none items-center min-w-full gap-3 tablet:py-3 gap-y-1 cursor-pointer group"
                onclick="window.location.href='${job.jobUrl}';"
              >
                <img src="${job.companyLogo}" alt="${job.company}" class="rounded-full h-6 min-w-max"/>
                <div class="flex flex-col justify-center gap-1 tablet:gap-2 font-normal">
                  <div class="flex flex-col tablet:flex-row tablet:items-center tablet:gap-2 text-[0.95rem] tablet:whitespace-nowrap items-start gap-[0.2rem]">
                    <h4>${job.title}</h4>
                    <h4 class="hidden tablet:block">✦</h4>
                    <h4 class="opacity-70 text-[0.9rem]">${job.company}</h4>
                  </div>
                  <div class="flex flex-wrap justify-start gap-2 text-[1rem]">
                    ${
                      job.salary
                        ? `
                      <span class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2">
                        ${job.salary}
                      </span>
                    `
                        : ""
                    }
                    <span class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2">
                      ${(job.jobFormat || "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                    <span class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2">
                      ${job.location || ""}
                    </span>
                    ${tagElements}
                  </div>
                </div>
                <div class="flex gap-2 items-center justify-center col-[_1_/_3] tablet:col-auto mt-2 tablet:mt-0 tablet:invisible tablet:group-hover:visible">
                  <a href="${job.jobUrl}" class="px-2 py-1 tablet:px-3 tablet:py-2 rounded-3xl bg-amber-11 text-slate-1 hover:bg-amber-10 duration-fast transition-all drop-shadow-sm tablet:text-[1rem] hover:ring-4 ring-slate-2 ring-opacity-80">
                    Apply
                  </a>
                  <ion-icon name="eye-off-outline" class="seen-job-btn text-base hover:scale-125 duration-fast transition-all cursor-pointer" role="button"></ion-icon>
                </div>
              </div>
            </div>
          `;

          this.uiManager.uiBinding.jobContainer.innerHTML =
            HTML + this.uiManager.uiBinding.jobContainer.innerHTML;
        } catch (error) {
          console.error("Error rendering job:", error, job);
        }
      });
    } else {
      jobs.forEach((job) => {
        const [tag1, tag2, tag3, tag4] = job.tags;

        const HTML = `
            <div
              class="job tablet:text-xxs text-[0.9rem] min-w-fit rounded-3xl tablet:rounded-[10rem] bg-amber-2 dark:bg-slate-11 px-6 py-3 pl-3 border-2 border-slate-3 backdrop-opacity-60 shadow-[0_0_0.2rem_0_rgba(0,0,0,0.1)] dark:border-opacity-40 max-h-fit leading-6 flex items-center justify-center transition-all duration-fast hover:bg-amber-3 dark:hover:bg-slate-9"
              id="${job.idJob}"
              data-filterkey="${filterKey}"
              data-filtervalue="${filterValue}"
            >
              <div
                class="grid tablet:grid-cols-[fit-content(100%)_1fr_fit-content(100%)] grid-cols-[fit-content(100%)_1fr] grid-rows-[1fr_fit-content(100%)] tablet:grid-rows-none items-center min-w-full gap-3 tablet:py-3 gap-y-1 cursor-pointer group"
                onclick="window.location.href='${job.jobUrl}';"
              >
                <img
                  src="${job.companyLogo}"
                  alt=${job.company}"
                  class="rounded-full h-6 min-w-max"
                />
                <div
                  class="flex flex-col justify-center gap-1 tablet:gap-2 font-normal"
                >
                  <div
                    class="flex flex-col tablet:flex-row tablet:items-center tablet:gap-2 text-[0.95rem] tablet:whitespace-nowrap items-start gap-[0.2rem]"
                  >
                    <h4>${job.title}</h4>
                    <h4 class="hidden tablet:block">✦</h4>
                    <h4 class="opacity-70 text-[0.9rem]">${job.company}</h4>
                  </div>

                  <div class="flex flex-wrap justify-start gap-2 text-[1rem]">
                  <span
                    class="${job.salary ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${job.salary || ""}</span>
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                    >
                      ${job.jobFormat.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span
                    >
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                      >${job.location}</span
                    >
                    <span
                      class="whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2"
                      >${filterValue.replace(/\b\w/g, (c) => c.toUpperCase())}</span
                    >
                  <span
                    class="${tag1 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag1?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag2 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag2?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag3 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag3?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  <span
                    class="${tag4 ? "whitespace-nowrap max-w-min font-lighter opacity-80 rounded-2xl dark:bg-slate-10 bg-[#F0E8DB] laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-9 px-2 py-1 tablet:py-2" : "hidden"}"
                    >
                    ${tag4?.replace(/\b\w/g, (c) => c.toUpperCase()) || ""}</span>
                  </div>
                </div>
                <div
                  class="flex gap-2 items-center justify-center col-[_1_/_3] tablet:col-auto mt-2 tablet:mt-0 tablet:invisible tablet:group-hover:visible"
                >
                  <a
                    href="${job.jobUrl}"
                    class="px-2 py-1 tablet:px-3 tablet:py-2 rounded-3xl bg-amber-11 text-slate-1 hover:bg-amber-10 duration-fast transition-all drop-shadow-sm tablet:text-[1rem] hover:ring-4 ring-slate-2 ring-opacity-80"
                    >Apply</a
                  >
                  <ion-icon
                    name="eye-outline"
                    class="seen-job-btn text-base hover:scale-125 duration-fast transition-all cursor-pointer"
                    role="button"
                  ></ion-icon>
                </div>
              </div>
            </div>
              `;
        this.uiManager.uiBinding.jobContainer.innerHTML =
          HTML + this.uiManager.uiBinding.jobContainer.innerHTML;
      });
    }

    this.uiManager.uiBinding.seenJobBtn =
      this.uiManager.uiBinding.safeQuerySelectorAll(".seen-job-btn");
    this.uiManager.uiBinding.seenJobBtn.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.uiManager.app.jobManager.handleSeenJob(e);
      });
    });
  }

  renderChips(chips) {
    chips.forEach((chip) => {
      const HTML = `                
        <span
          id="${chip.idChip}"
          data-filterkey="category"
          data-Filtervalue="${chip.name}"
          data-FilterSlug="${chip.slug}"
          data-source="chip"
          class="chip whitespace-nowrap max-w-min font-lighter opacity-80 laptop:px-3 laptop:py-2 px-2 py-1 rounded-xl dark:bg-slate-10 bg-[#F0E8DB] text-[1rem] laptop:text-sm laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-11"
          >${chip.name}</span
        >`;
      this.uiManager.uiBinding.chipsContainer.innerHTML += HTML;
    });
  }

  renderFilters(categories, filter) {
    let counterOne = 0;
    let counterTwo = 0;
    let counterThree = 0;

    categories.forEach((category) => {
      switch (category.key) {
        case "job_type":
          category.values.forEach((value) => {
            if (
              this.uiManager.app.filterManager.favoriteFilters.some(
                (favFilter) => favFilter.value === value
              )
            )
              return;

            const jobTypeHTML = `
                <label
                    class="filter-btn inline-flex items-center gap-3 cursor-pointer group w-fit px-3 py-2 rounded-2xl hover:bg-amber-2 dark:hover:bg-slate-11 transition-all duration-fast"
                    value="${value}"
                    id="${this.uiManager.idManager("filter")}"
                    data-filtervalue="${value}"
                  >
                  <ion-icon class="toggle-fav-filter-on text-sm hover:text-rose-950 hover:scale-110 duration-fast transition-all dark:hover:text-rose-100" name="heart-half-outline"></ion-icon>
                    <input
                      type="checkbox"
                      class="relative w-4 h-4 border-[0.2rem] rounded-xl appearance-none cursor-pointer border-amber-4 dark:border-slate-6 checked:bg-amber-9 dark:checked:bg-slate-6 checked:border-0 focus:ring-4 focus:ring-amber-3 dark:focus:ring-slate-7 focus:ring-opacity-70 focus:outline-none transition-all duration-fast checked:after:absolute checked:after:content-[''] checked:after:left-1/2 checked:after:top-1/2 checked:after:w-2 checked:after:h-3.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-slate-1 checked:after:rotate-45 checked:after:translate-x-[-50%] checked:after:translate-y-[-70%]"
                    />
                    <span
                      class="text-xs font-serif3 text-amber-11 dark:text-slate-4 group-hover:text-amber-9 dark:group-hover:text-slate-6 transition-colors duration-fast select-none"
                    >
                      ${value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </label>`;
            this.uiManager.uiBinding.safeQuerySelector(
              "#job-type-filters-container"
            ).innerHTML += jobTypeHTML;
          });
          break;

        case "candidate_required_location":
          category.values.forEach((value) => {
            if (
              this.uiManager.app.filterManager.favoriteFilters.some(
                (favFilter) => favFilter.value === value
              )
            )
              return;

            if (counterOne <= 4) {
              const jobTypeHTML = `
                <label
                    class="filter-btn inline-flex items-center gap-3 cursor-pointer group w-fit px-3 py-2 rounded-2xl hover:bg-amber-2 dark:hover:bg-slate-11 transition-all duration-fast"
                    value="${value}"
                    id="${category.idCategory}"
                    data-filtervalue="${value}"
                  >
                  <ion-icon class="toggle-fav-filter-on text-sm hover:text-rose-950 hover:scale-110 duration-fast transition-all dark:hover:text-rose-100" name="heart-half-outline"></ion-icon>
                    <input
                      type="checkbox"
                      class="relative w-4 h-4 border-[0.2rem] rounded-xl appearance-none cursor-pointer border-amber-4 dark:border-slate-6 checked:bg-amber-9 dark:checked:bg-slate-6 checked:border-0 focus:ring-4 focus:ring-amber-3 dark:focus:ring-slate-7 focus:ring-opacity-70 focus:outline-none transition-all duration-fast checked:after:absolute checked:after:content-[''] checked:after:left-1/2 checked:after:top-1/2 checked:after:w-2 checked:after:h-3.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-slate-1 checked:after:rotate-45 checked:after:translate-x-[-50%] checked:after:translate-y-[-70%]"
                    />
                    <span
                      class="text-xs font-serif3 text-amber-11 dark:text-slate-4 group-hover:text-amber-9 dark:group-hover:text-slate-6 transition-colors duration-fast select-none leading-9"
                    >
                      ${value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </label>`;
              this.uiManager.uiBinding.safeQuerySelector(
                "#location-filters-container"
              ).innerHTML += jobTypeHTML;
              counterOne++;
            }
          });
          break;
        case "company_name":
          category.values.forEach((value) => {
            if (
              this.uiManager.app.filterManager.favoriteFilters.some(
                (favFilter) => favFilter.value === value
              )
            )
              return;

            if (value.split(" ").length === 2) return;

            if (counterTwo <= 4) {
              const jobTypeHTML = `
                <label
                    class="filter-btn inline-flex items-center gap-3 cursor-pointer group w-fit px-3 py-2 rounded-2xl hover:bg-amber-2 dark:hover:bg-slate-11 transition-all duration-fast"
                    value="${value}"
                    id="${category.idCategory}"
                    data-filtervalue="${value}"
                  >
                  <ion-icon class="toggle-fav-filter-on text-sm hover:text-rose-950 hover:scale-110 duration-fast transition-all dark:hover:text-rose-100" name="heart-half-outline"></ion-icon>
                    <input
                      type="checkbox"
                      class="relative w-4 h-4 border-[0.2rem] rounded-xl appearance-none cursor-pointer border-amber-4 dark:border-slate-6 checked:bg-amber-9 dark:checked:bg-slate-6 checked:border-0 focus:ring-4 focus:ring-amber-3 dark:focus:ring-slate-7 focus:ring-opacity-70 focus:outline-none transition-all duration-fast checked:after:absolute checked:after:content-[''] checked:after:left-1/2 checked:after:top-1/2 checked:after:w-2 checked:after:h-3.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-slate-1 checked:after:rotate-45 checked:after:translate-x-[-50%] checked:after:translate-y-[-70%]"
                    />
                    <span
                      class="text-xs font-serif3 text-amber-11 dark:text-slate-4 group-hover:text-amber-9 dark:group-hover:text-slate-6 transition-colors duration-fast select-none leading-9"
                    >
                      ${value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </label>`;
              this.uiManager.uiBinding.safeQuerySelector(
                "#companies-filters-container"
              ).innerHTML += jobTypeHTML;
              counterTwo++;
            }
          });
          break;
        case "tags":
          category.values.forEach((value) => {
            if (
              this.uiManager.app.filterManager.favoriteFilters.some(
                (favFilter) => favFilter.value === value
              )
            )
              return;

            if (value.split(" ").length === 2) return;

            if (counterThree <= 4) {
              const jobTypeHTML = `
                <label
                    class="filter-btn inline-flex items-center gap-3 cursor-pointer group w-fit px-3 py-2 rounded-2xl hover:bg-amber-2 dark:hover:bg-slate-11 transition-all duration-fast"
                    value="${value}"
                    id="${category.idCategory}"
                    data-filtervalue="${value}"
                  >
                  <ion-icon class="toggle-fav-filter-on text-sm hover:text-rose-950 hover:scale-110 duration-fast transition-all dark:hover:text-rose-100" name="heart-half-outline"></ion-icon>
                    <input
                      type="checkbox"
                      class="relative w-4 h-4 border-[0.2rem] rounded-xl appearance-none cursor-pointer border-amber-4 dark:border-slate-6 checked:bg-amber-9 dark:checked:bg-slate-6 checked:border-0 focus:ring-4 focus:ring-amber-3 dark:focus:ring-slate-7 focus:ring-opacity-70 focus:outline-none transition-all duration-fast checked:after:absolute checked:after:content-[''] checked:after:left-1/2 checked:after:top-1/2 checked:after:w-2 checked:after:h-3.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-slate-1 checked:after:rotate-45 checked:after:translate-x-[-50%] checked:after:translate-y-[-70%]"
                    />
                    <span
                      class="text-xs font-serif3 text-amber-11 dark:text-slate-4 group-hover:text-amber-9 dark:group-hover:text-slate-6 transition-colors duration-fast select-none leading-9"
                    >
                      ${value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </label>`;
              this.uiManager.uiBinding.safeQuerySelector(
                "#tags-filters-container"
              ).innerHTML += jobTypeHTML;
              counterThree++;
            }
          });
          break;
      }
    });
  }

  renderFavFilters(favFilters) {
    this.uiManager.uiBinding.favFiltersContainer.innerHTML = ""; // Clear existing content

    favFilters.forEach((filter) => {
      const HTML = `
        <label
          class="favorite-filter-btn inline-flex items-center gap-3 cursor-pointer group w-fit px-3 py-2 rounded-2xl hover:bg-amber-2 dark:hover:bg-slate-11 transition-all duration-fast"
          data-filterkey="${filter.key}"
          data-filtervalue="${filter.value}"
          id="${filter.idFilter}"
        >
          <input
            type="checkbox"
            class="relative w-4 h-4 border-[0.2rem] rounded-xl appearance-none cursor-pointer border-amber-4 dark:border-slate-6 checked:bg-amber-9 dark:checked:bg-slate-6 checked:border-0 focus:ring-4 focus:ring-amber-3 dark:focus:ring-slate-7 focus:ring-opacity-70 focus:outline-none transition-all duration-fast checked:after:absolute checked:after:content-[''] checked:after:left-1/2 checked:after:top-1/2 checked:after:w-2 checked:after:h-3.5 checked:after:border-r-2 checked:after:border-b-2 checked:after:border-slate-1 checked:after:rotate-45 checked:after:translate-x-[-50%] checked:after:translate-y-[-70%]"
            ${this.uiManager.app.filterManager.isActiveFilter(filter.key, filter.value) ? "checked" : ""}
          />
          <span
            class="text-[1.2rem] font-serif3 text-amber-11 dark:text-slate-4 group-hover:text-amber-9 dark:group-hover:text-slate-6 transition-colors duration-fast select-none"
          >
            ${filter.value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <ion-icon 
            class="toggle-fav-filter-off text-sm text-rose-500 hover:scale-110 duration-fast transition-all" 
            name="heart"
            role="button"
          ></ion-icon>
        </label>`;
      this.uiManager.uiBinding.favFiltersContainer.innerHTML += HTML;
    });
  }
}

class UITheme {
  constructor(UIManagerIns) {
    this.uiManager = UIManagerIns;
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      this.uiManager.uiBinding.htmlEl.classList.add("dark");
    } else {
      this.uiManager.uiBinding.htmlEl.classList.remove("dark");
    }
  }

  toggleTheme() {
    this.uiManager.uiBinding.htmlEl.classList.toggle("dark");

    const newTheme = this.uiManager.uiBinding.htmlEl.classList.contains("dark")
      ? "dark"
      : "light";

    localStorage.setItem("theme", newTheme);
  }
}

class UIBinding {
  constructor(UIManagerIns) {
    this.uiManager = UIManagerIns;

    this.searchBarSearchBtn = this.safeQuerySelector("#searchbar-btn");
    this.searchBarSearch = this.safeQuerySelector("#searchbar");
    this.chipsContainer = this.safeQuerySelector("#chips-container");
    this.filtersContainer = this.safeQuerySelector("#filters-container");
    this.jobContainer = this.safeQuerySelector("#jobs-container");
    this.loadingSkeltonJobs = this.safeQuerySelector("#loading-skelton-jobs");
    this.loadingSkeltonChips = this.safeQuerySelector("#loading-skelton-chips");
    this.filterPanelsSkeleton = this.safeQuerySelectorAll(
      ".filter-loading-skelton "
    );
    this.seenJobBtn = this.safeQuerySelectorAll(".seen-job-btn");
    this.seenJobPresent = this.safeQuerySelector("#seen-jobs-present");
    this.seenJobPresentMobile = this.safeQuerySelector(
      "#seen-jobs-present-mobile"
    );
    this.favFiltersBtn = this.safeQuerySelectorAll(".favorite-filter-btn");
    this.sortingOptions = this.safeQuerySelector("#sorting-options");
    this.htmlEl = this.safeQuerySelector("html");
    this.dropdownNavbarToggle = this.safeQuerySelector(
      "#dropdown-toggle-navbar"
    );
    this.dropdownNavbarMenu = this.safeQuerySelector("#dropdown-menu-navbar");
    this.overlay = this.safeQuerySelector("#overlay");
    this.themeToggle = this.safeQuerySelector("#theme-toggle");
    if (this.themeToggle) {
      this.themeToggle.addEventListener("click", () =>
        this.uiManager.uiTheme.toggleTheme()
      );
    } else {
      console.warn(
        "Theme toggle element not found. Theme switching will not work."
      );
    }
    this.mobileMenuToggle = this.safeQuerySelector("#mobile-menu");
    this.mobileMenuLinks = this.safeQuerySelector("#mobile-menu-links");
    this.jobCount = this.safeQuerySelector("#job-count");
    this.jobCountAlert = this.safeQuerySelector("#job-count-alert");
    this.navbar = this.safeQuerySelector("nav");
    this.searchbarSection = this.safeQuerySelector("#searchbar-section");
    // Add new favorite filters related bindings
    this.favFilterToggleBtns = this.safeQuerySelectorAll(
      ".toggle-fav-filter-on"
    );
    this.favFiltersContainer = this.safeQuerySelector(
      "#favorite-filters-container"
    );
    // Add new bindings for panels
    this.locationPanel = this.safeQuerySelector(
      '[data-filterkey="candidate_required_location"]'
    );
    this.jobFormatPanel = this.safeQuerySelector('[data-filterkey="job_type"]');
    this.companyPanel = this.safeQuerySelector(
      '[data-filterkey="company_name"]'
    );
    // Add new binding for favorite filters panel
    this.favoriteFiltersPanel = this.safeQuerySelector(
      "#favorite-filters-panel"
    );
  }

  safeQuerySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Element not found: ${selector}`);
    }
    return element;
  }

  safeQuerySelectorAll(selector) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) {
      console.warn(`No elements found: ${selector}`);
    }
    return elements;
  }

  bindEvents() {
    this.searchBarSearchBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const searchTerm = this.searchBarSearch.value;
      if (!searchTerm) return;

      const { filterKey, filterValue } =
        this.uiManager.app.filterManager.findMatchingFilter(searchTerm);
      console.log("filterKey and filterValue:", filterKey, filterValue);

      if (filterKey && filterValue) {
        this.uiManager.app.handleSearchingEvent(
          this.searchBarSearch,
          "searchbar",
          filterKey,
          filterValue,
          "_",
          "_"
        );
      } else {
        const matchedJobs = await this.advancedSearch(searchTerm);
        if (matchedJobs && matchedJobs.length > 0) {
          this.uiManager.app.handleSearchingEvent(
            this.searchBarSearch,
            "searchbar",
            matchedJobs[0].filterKey,
            matchedJobs[0].filterValue,
            "_",
            "_",
            matchedJobs
          );
        }
      }
    });

    this.searchBarSearch.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const searchTerm = this.searchBarSearch.value;
        if (!searchTerm) return;

        const { filterKey, filterValue } =
          this.uiManager.app.filterManager.findMatchingFilter(searchTerm);
        console.log("filterKey and filterValue:", filterKey, filterValue);

        if (filterKey && filterValue) {
          this.uiManager.app.handleSearchingEvent(
            this.searchBarSearch,
            "searchbar",
            filterKey,
            filterValue,
            "_",
            "_"
          );
        } else {
          const matchedJobs = await this.advancedSearch(searchTerm);
          if (matchedJobs && matchedJobs.length > 0) {
            this.uiManager.app.handleSearchingEvent(
              this.searchBarSearch,
              "searchbar",
              matchedJobs[0].filterKey,
              matchedJobs[0].filterValue,
              "_",
              "_",
              matchedJobs
            );
          }
        }
      }
    });

    this.chipsContainer.addEventListener("click", (e) => {
      const chipElement = e.target.closest(".chip");
      console.log(chipElement);

      chipElement &&
        this.uiManager.app.handleSearchingEvent(
          e.target,
          "chip",
          chipElement?.dataset?.filterkey,
          chipElement?.dataset?.filtervalue,
          this.uiManager.app.filterManager.isActiveFilter(
            chipElement?.dataset?.filterkey,
            chipElement?.dataset?.filtervalue
          )
        );
      console.log(
        "filterValue and filterKey:",
        chipElement?.dataset?.filtervalue,
        chipElement?.dataset?.filterkey
      );
    });

    this.filtersContainer.addEventListener("click", (e) => {
      const heartIcon = e.target.closest(".toggle-fav-filter-on");
      const filterBtn = e.target.closest(".filter-btn");
      const filterPanel = e.target.closest(".filter-panel");

      // Only handle favorite filter toggle if heart icon is clicked
      if (heartIcon || e.target.classList.contains("toggle-fav-filter-on")) {
        e.stopPropagation();
        e.preventDefault();
        if (filterBtn && filterPanel) {
          this.uiManager.app.filterManager.toggleFavoriteFilter(
            filterBtn.id,
            filterPanel.dataset.filterkey,
            filterBtn.dataset.filtervalue
          );
        }
        return;
      }

      // Handle search event for filter clicks
      if (filterBtn) {
        this.uiManager.app.handleSearchingEvent(
          filterBtn,
          "filter",
          filterPanel?.dataset?.filterkey,
          filterBtn?.dataset?.filtervalue,
          filterBtn?.id,
          filterBtn?.classList.contains("ACTIVE") ? true : false
        );
      }
    });

    this.favFiltersContainer.addEventListener("click", (e) => {
      const removeIcon = e.target.closest(".toggle-fav-filter-off");
      const filterBtn = e.target.closest(".favorite-filter-btn");

      // Handle favorite filter removal
      if (removeIcon || e.target.classList.contains("toggle-fav-filter-off")) {
        e.stopPropagation();
        e.preventDefault();
        const filterPanel = document.querySelector(
          `.filter-panel[data-filterkey="${filterBtn.dataset.filterkey}"]`
        );
        const regularFilterBtn = filterPanel.querySelector(
          `.filter-btn[data-filtervalue="${filterBtn.dataset.filtervalue}"]`
        );

        if (regularFilterBtn) {
          const regularHeartIcon = regularFilterBtn.querySelector("ion-icon");
          if (regularHeartIcon) {
            regularHeartIcon.setAttribute("name", "heart-half-outline");
          }
        }

        if (filterBtn) {
          this.uiManager.app.filterManager.toggleFavoriteFilter(
            filterBtn.id,
            filterBtn.dataset.filterkey,
            filterBtn.dataset.filtervalue
          );
        }
        return;
      }

      // Handle search event for favorite filter clicks
      if (filterBtn) {
        const checkbox = filterBtn.querySelector('input[type="checkbox"]');
        this.uiManager.app.handleSearchingEvent(
          filterBtn,
          "filter",
          filterBtn.dataset.filterkey,
          filterBtn.dataset.filtervalue,
          filterBtn.id,
          checkbox.checked
        );
      }
    });

    this.dropdownNavbarToggle.addEventListener("click", () => {
      if (this.dropdownNavbarMenu.classList.contains("hidden")) {
        const iconEl = document.getElementById("dropdown-toggle-navbar-icon");
        iconEl.classList.add("rotate-90");
        this.uiManager.uiOverlay.addOverlay();
        this.dropdownNavbarMenu.classList.add("flex");
        this.dropdownNavbarMenu.classList.remove("hidden");
      } else {
        this.uiManager.uiOverlay.removeOverlay();
        this.dropdownNavbarMenu.classList.add("hidden");
      }
    });

    this.mobileMenuToggle.addEventListener("change", () => {
      if (this.mobileMenuLinks.classList.contains("translate-x-[-50rem]")) {
        this.uiManager.uiOverlay.addOverlay();
        this.mobileMenuLinks.classList.remove("translate-x-[-50rem]");
      } else {
        this.uiManager.uiOverlay.removeOverlay();
        this.mobileMenuLinks.classList.add("translate-x-[-50rem]");
      }
    });

    this.safeQuerySelector("#dropdown-toggle-navbar-mobile").addEventListener(
      "click",
      () => {
        const dropdownMenu = this.safeQuerySelector(
          "#dropdown-menu-navbar-mobile"
        );

        dropdownMenu.classList.toggle("opacity-100");
      }
    );

    this.jobCount.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });

    this.jobCount.addEventListener("change", (e) => {
      const count = parseInt(e.target.value);
      if (!this.isJobCountValid(count)) {
        e.target.value = "15";
      }
    });

    this.seenJobPresentMobile.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const seenJobs = this.uiManager.app.jobManager.seenJobs;
      console.log("seenJobs:", seenJobs);
      this.uiManager.app.uiManager.uiRendering.renderJobs(
        seenJobs,
        null,
        null,
        "seenJobs"
      );
      // Close sidebar if open;
      if (!this.mobileMenuLinks.classList.contains("translate-x-[-50rem]")) {
        this.mobileMenuLinks.classList.add("translate-x-[-50rem]");
        this.mobileMenuToggle.checked = false;
        this.uiManager.uiOverlay.removeOverlay();
      }

      // Scroll to content section accounting for navbar height
      const contentSection = document.getElementById("content-section");
      const navHeight = this.navbar.offsetHeight;
      const contentOffset = contentSection.offsetTop - navHeight;
      window.scrollTo({
        top: contentOffset,
        behavior: "smooth",
      });
    });

    this.seenJobPresent.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const seenJobs = this.uiManager.app.jobManager.seenJobs;
      this.uiManager.app.uiManager.uiRendering.renderJobs(
        seenJobs,
        null,
        null,
        "seenJobs"
      );

      // Scroll to content section accounting for navbar height
      const contentSection = document.getElementById("content-section");
      const navHeight = this.navbar.offsetHeight;
      const contentOffset = contentSection.offsetTop - navHeight;
      window.scrollTo({
        top: contentOffset,
        behavior: "smooth",
      });
    });

    this.observeNavbar();

    // Add event listeners for both desktop and mobile dropdown menus
    ["#dropdown-menu-navbar", "#dropdown-menu-navbar-mobile"].forEach(
      (menuId) => {
        const menu = this.safeQuerySelector(menuId);
        if (menu) {
          menu.addEventListener("click", (e) => {
            const button = e.target.closest("button");
            if (!button) return;

            const buttonText = button.textContent.trim().toLowerCase();
            this.handleDropdownNavigation(buttonText);

            // Close the dropdown after clicking
            if (menuId === "#dropdown-menu-navbar") {
              this.dropdownNavbarMenu.classList.add("hidden");
              this.uiManager.uiOverlay.removeOverlay();
            }

            // Close the mobile dropdown after clicking
            if (menuId === "#dropdown-menu-navbar-mobile") {
              // Close the mobile sidebar if it's open
              if (
                !this.mobileMenuLinks.classList.contains("translate-x-[-50rem]")
              ) {
                this.mobileMenuLinks.classList.add("translate-x-[-50rem]");
                this.mobileMenuToggle.checked = false;
                this.uiManager.uiOverlay.removeOverlay();
              }
            }
          });
        }
      }
    );

    // Add event listeners for favorite filters buttons
    const favFilterButtons = [
      ...this.safeQuerySelectorAll(
        'button:has(ion-icon[name="heart-outline"])'
      ),
      ...this.safeQuerySelectorAll(
        'button:has(ion-icon[name="heart-half-sharp"])'
      ),
    ];

    favFilterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.scrollToElement(this.favoriteFiltersPanel);
        this.highlightPanel(this.favoriteFiltersPanel);

        // Close mobile menu if open
        if (!this.mobileMenuLinks.classList.contains("translate-x-[-50rem]")) {
          this.mobileMenuLinks.classList.add("translate-x-[-50rem]");
          this.mobileMenuToggle.checked = false;
          this.uiManager.uiOverlay.removeOverlay();
        }
      });
    });
  }

  handleDropdownNavigation(buttonText) {
    switch (buttonText) {
      case "category":
        this.scrollToElement(this.chipsContainer);
        break;
      case "location":
        this.scrollToElement(this.locationPanel);
        this.highlightPanel(this.locationPanel);
        break;
      case "job format":
        this.scrollToElement(this.jobFormatPanel);
        this.highlightPanel(this.jobFormatPanel);
        break;
      case "company":
        this.scrollToElement(this.companyPanel);
        this.highlightPanel(this.companyPanel);
        break;
    }
  }

  scrollToElement(element) {
    if (!element) return;

    // Calculate offset considering the navbar height
    const navbarHeight = this.navbar.offsetHeight;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition =
      elementPosition + window.pageYOffset - navbarHeight - 20;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }

  highlightPanel(panel) {
    if (!panel) return;

    // Add highlight ring
    panel.classList.add(
      "ring-8",
      "ring-green-200",
      "dark:ring-green-900",
      "ring-opacity-50"
    );

    // Remove highlight after 3 seconds
    setTimeout(() => {
      panel.classList.remove(
        "ring-8",
        "ring-green-200",
        "dark:ring-green-900",
        "ring-opacity-50"
      );
    }, 3000);
  }

  isJobCountValid(jobCount) {
    if (jobCount > 0 && jobCount <= 30) return jobCount;
    this.uiManager.app.handleError("jobCountInvalid", null, null);
    return false;
  }

  async advancedSearch(searchTerm) {
    try {
      const data = await this.uiManager.uiLoading.loadingManagerSearch(
        fetch(this.uiManager.app.jobManager.apiEndpoint).then((response) => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.json();
        })
      );
      const normalizedSearch = searchTerm.toLowerCase();
      console.log(
        "normalizedSearch, searchTerm, data:",
        normalizedSearch,
        searchTerm,
        data
      );

      // First, find exact matches
      let exactMatches = data.jobs
        .filter((job) => {
          return (
            job.title?.toLowerCase() === normalizedSearch ||
            job.tags?.some((tag) => tag.toLowerCase() === normalizedSearch) ||
            job.candidate_required_location?.toLowerCase() ===
              normalizedSearch ||
            job.company_name?.toLowerCase() === normalizedSearch
          );
        })
        .map((job) => {
          let filterKey, filterValue;

          if (job.title.toLowerCase() === normalizedSearch) {
            filterKey = "search_by_title";
            filterValue = `Title: ${job.title}`;
          } else if (
            job.tags?.some((tag) => tag.toLowerCase() === normalizedSearch)
          ) {
            filterKey = "search_by_tag";
            filterValue = `Tag: ${job.tags.find((tag) => tag.toLowerCase() === normalizedSearch)}`;
          } else if (
            job.candidate_required_location?.toLowerCase() === normalizedSearch
          ) {
            filterKey = "search_by_location";
            filterValue = `Location: ${job.candidate_required_location}`;
          } else if (job.company_name?.toLowerCase() === normalizedSearch) {
            filterKey = "search_by_company";
            filterValue = `Company: ${job.company_name}`;
          }

          return new Job(
            this.uiManager.app.jobManager,
            this.uiManager.idManager("job", job),
            job.title,
            job.url,
            job.job_type,
            job.company_name,
            job.candidate_required_location,
            job.company_logo,
            job.publication_date,
            job.description,
            job.salary,
            job.tags,
            filterKey,
            filterValue
          );
        });
      console.log("exactMatches:", exactMatches);

      // Then, find partial matches
      let partialMatches = data.jobs
        .filter((job) => {
          return (
            !exactMatches.some((exact) => exact.idJob === job.id) && // Exclude exact matches
            (job.title?.toLowerCase().includes(normalizedSearch) ||
              job.tags?.some((tag) =>
                tag?.toLowerCase().includes(normalizedSearch)
              ) ||
              job.candidate_required_location
                ?.toLowerCase()
                .includes(normalizedSearch) ||
              job.company_name?.toLowerCase().includes(normalizedSearch))
          );
        })
        .map((job) => {
          let filterKey = "search_partial";
          let filterValue = `Search: ${searchTerm}`;

          return new Job(
            this.uiManager.app.jobManager,
            this.uiManager.idManager("job", job),
            job.title,
            job.url,
            job.job_type,
            job.company_name,
            job.candidate_required_location,
            job.company_logo,
            job.publication_date,
            job.description,
            job.salary,
            job.tags,
            filterKey,
            filterValue
          );
        });

      if (exactMatches.length === 0 && partialMatches.length === 0) {
        this.uiManager.app.handleError("searchNotFound", null, null);
        console.log("No matches found");
        return null;
      }

      // Get required job count
      const requiredJobCount = this.isJobCountValid(this.jobCount.value) || 15;

      // Fill with partial matches if needed
      let result = [...exactMatches];
      if (result.length < requiredJobCount) {
        result.push(
          ...partialMatches.slice(0, requiredJobCount - result.length)
        );
      }

      return result;
    } catch (error) {
      this.uiManager.app.handleError(
        "searchNotFound",
        error.code,
        error.message
      );
      return null;
    }
  }

  observeNavbar() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // When navbar is at the searchbar section
          this.navbar.classList.remove(
            "bg-opacity-90",
            "backdrop-blur-sm",
            "shadow-md",
            "dark:bg-slate-11",
            "bg-amber-2"
          );
          this.navbar.classList.add("dark:bg-slate-9", "bg-amber-1");
        } else {
          // When navbar has passed the searchbar section
          this.navbar.classList.remove("dark:bg-slate-9", "bg-amber-1");
          this.navbar.classList.add(
            "bg-opacity-90",
            "backdrop-blur-sm",
            "shadow-md",
            "dark:bg-slate-11",
            "bg-amber-2"
          );
        }
      },
      {
        threshold: 0,
        rootMargin: "-80px 0px 0px 0px", // Adjust based on navbar height
      }
    );

    observer.observe(this.searchbarSection);
  }
}

class UIOverlay {
  constructor(UIManagerIns) {
    this.uiManager = UIManagerIns;
  }

  addOverlay() {
    this.uiManager.uiBinding.overlay.classList.add("flex");
    this.uiManager.uiBinding.overlay.classList.remove("hidden");
    this.uiManager.uiBinding.overlay.addEventListener("click", () => {
      this.removeOverlay();
      this.overlayControl();
    });
  }

  removeOverlay() {
    this.uiManager.uiBinding.overlay.classList.add("hidden");
  }

  overlayControl() {
    this.uiManager.uiBinding.dropdownNavbarMenu.classList.add("hidden");
    this.uiManager.uiBinding.mobileMenuLinks.classList.add(
      "translate-x-[-50rem]"
    );
    this.uiManager.uiBinding.safeQuerySelector("#mobile-menu").checked =
      !this.uiManager.uiBinding.safeQuerySelector("#mobile-menu").checked;
  }
}

class UILoading {
  constructor(UIManagerIns) {
    this.uiManager = UIManagerIns;
  }

  showLoadingInit() {
    this.uiManager.uiBinding.loadingSkeltonJobs.classList.remove("hidden");
    this.uiManager.uiBinding.loadingSkeltonChips.classList.remove("hidden");
    this.uiManager.uiBinding.filterPanelsSkeleton.forEach((filterPanel) =>
      filterPanel.classList.remove("hidden")
    );
  }

  hideLoadingInit() {
    this.uiManager.uiBinding.loadingSkeltonJobs.classList.add("hidden");
    this.uiManager.uiBinding.loadingSkeltonChips.classList.add("hidden");
    this.uiManager.uiBinding.filterPanelsSkeleton.forEach((filterPanel) =>
      filterPanel.classList.add("hidden")
    );
  }

  loadingManagerInit(promise) {
    this.showLoadingInit();
    return promise
      .then((result) => {
        this.hideLoadingInit();
        return result;
      })
      .catch((error) => {
        this.hideLoadingInit();
        throw error;
      });
  }

  showLoadingSearch() {
    this.uiManager.uiBinding.loadingSkeltonJobs.classList.remove("hidden");
  }

  hideLoadingSearch() {
    this.uiManager.uiBinding.loadingSkeltonJobs.classList.add("hidden");
  }

  loadingManagerSearch(promise) {
    this.showLoadingSearch();
    return promise
      .then((result) => {
        this.hideLoadingSearch();
        return result;
      })
      .catch((error) => {
        this.hideLoadingSearch();
        throw error;
      });
  }
}
/*****************************************************************************************/
/*****************************************************************************************/
/*****************************************************************************************/

class JobManager {
  constructor(appIns) {
    this.app = appIns;
    this.apiEndpoint = "https://remotive.com/api/remote-jobs";
    this.jobs = [];
    this.jobsDisplayed = [];
    this.seenJobs = this.getSeenJobs();
    this.jobsRandom = [];
  }

  async fetchJobs(source, filterKey, filterValue, limit = 5) {
    try {
      const apiUrl = this.createApiUrl(filterKey, filterValue);

      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      const filteredJobs = this.app.filterManager
        .filterJobsByValue(data.jobs, filterKey, filterValue)
        .slice(0, limit);

      this.jobs = [];
      filteredJobs.forEach((j) => {
        const job = new Job(
          this,
          this.app.uiManager.idManager("job", j),
          j.title,
          j.url,
          j.job_type,
          j.company_name,
          j.candidate_required_location,
          j.company_logo,
          j.publication_date,
          j.description,
          j.salary,
          j.tags,
          filterKey,
          filterValue
        );

        this.jobs.push(job);
      });
      return this.jobs;
    } catch (error) {
      this.appIns.handleError("fetchingJobs", error.code, error.message);
    }
  }

  createApiUrl(filterKey, filterValue) {
    let queryParams,
      apiUrl = this.apiEndpoint;

    switch (filterKey) {
      case "salary":
        break;

      case "candidate_required_location":
        break;

      case "job_type":
        break;

      case "tags":
        break;

      default:
        queryParams = new URLSearchParams({
          [filterKey]: filterValue,
        }).toString();
        apiUrl = `${this.apiEndpoint}?${queryParams}`;
    }
    // console.log("Query Params:", queryParams);
    // console.log("API URL:", apiUrl);

    return apiUrl;
  }

  getSeenJobs() {
    const storedSeenJobs = JSON.parse(localStorage.getItem("seenJobs")) || [];

    this.seenJobs = storedSeenJobs.map(
      (jobData) =>
        new Job(
          this,
          jobData.idJob,
          jobData.title,
          jobData.jobUrl,
          jobData.jobFormat,
          jobData.company,
          jobData.location,
          jobData.companyLogo,
          jobData.postingDate,
          jobData.description,
          jobData.salary,
          jobData.tags,
          jobData.filterKey,
          jobData.filterValue
        )
    );

    console.log("Loaded Seen Jobs:", this.seenJobs);
    return this.seenJobs;
  }

  saveSeenJob() {
    const uniqueSeenJobs = Array.from(
      new Set(this.seenJobs.map((job) => job.idJob))
    ).map((idJob) => this.seenJobs.find((job) => job.idJob === idJob));

    localStorage.setItem(
      "seenJobs",
      JSON.stringify(uniqueSeenJobs.map((job) => job.getJob))
    );

    console.log("Saved Seen Jobs:", uniqueSeenJobs);
  }

  toggleJobSeen(job, eventTarget) {
    const jobIndex = this.seenJobs.findIndex(
      (seenJob) => seenJob.idJob === job.idJob
    );

    jobIndex === -1
      ? (this.seenJobs.push(job), (job.isSeen = true))
      : (this.seenJobs.splice(jobIndex, 1), (job.isSeen = false));

    this.app.uiManager.seenJobsUI(
      job,
      jobIndex === -1 ? "add" : "remove",
      eventTarget
    );
  }

  handleSeenJob(event) {
    event.stopPropagation();
    event.preventDefault();

    const jobCard = event.target.closest(".job");
    const jobId = jobCard.id;
    console.log("Job ID:", jobId);

    let job =
      this.jobsDisplayed.find((job) => job.idJob === Number(jobId)) ||
      this.jobsRandom.find((job) => job.idJob === Number(jobId)) ||
      this.seenJobs.find((job) => job.idJob === Number(jobId));

    if (!job) {
      console.log("Job not found");
      return;
    }

    this.toggleJobSeen(job, event.target);

    // Only add the seen-job class if the job is actually seen
    if (job.isSeen) {
      jobCard.classList.add("seen-job");
    } else {
      jobCard.classList.remove("seen-job");
    }

    this.saveSeenJob();
  }

  removeActiveFiltersJobs(filterKey, filterValue) {
    const jobsDivs =
      this.app.uiManager.uiBinding.jobContainer.querySelectorAll("div.job");
    console.log("Job Divs:", jobsDivs);
    const removingJobs = [];

    this.jobsDisplayed = this.jobsDisplayed.filter((job) => {
      const shouldRemove =
        job.filterKey === filterKey && job.filterValue === filterValue;
      console.log(`Job ID: ${job.idJob}, Should Remove: ${shouldRemove}`);
      if (shouldRemove) {
        removingJobs.push(job.idJob);
      }
      return !shouldRemove;
    });

    removingJobs.forEach((jobId) => {
      jobsDivs.forEach((div) => {
        if (div.getAttribute("id") === String(jobId)) {
          console.log(`Removing job div with ID: ${jobId}`);
          div.remove();
        }
      });
    });

    console.log(
      `Removed jobs with filterKey: "${filterKey}" and filterValue: "${filterValue}"`
    );

    return this.jobsDisplayed;
  }
}

class Job {
  constructor(
    JobManager,
    IdJob,
    Title,
    JobUrl,
    JobFormat,
    Company,
    Location,
    CompanyLogo,
    PostingDate,
    Description,
    Salary,
    Tags,
    filterKey,
    filterValue
  ) {
    this.jobManager = JobManager;
    this.idJob = IdJob;
    this.title = Title;
    this.jobUrl = JobUrl;
    this.jobFormat = JobFormat;
    this.company = Company;
    this.location = Location;
    this.companyLogo = CompanyLogo;
    this.description = Description;
    this.salary = this.extractCleanSalary(Salary);
    this.publicationDate = this.validateAndFormatDate(PostingDate);
    this.tags = Tags;
    this.filterKey = filterKey;
    this.filterValue = filterValue;
    this.isSeen = false;
  }

  get getJob() {
    return {
      idJob: this.idJob,
      title: this.title,
      jobUrl: this.jobUrl,
      jobFormat: this.jobFormat,
      company: this.company,
      location: this.location,
      isSeen: this.isSeen,
      companyLogo: this.companyLogo,
      postingDate: this.postingDate,
      description: this.description,
      salary: this.salary,
    };
  }

  renderLogo() {
    return Object.assign(document.createElement("img"), {
      src: this.companyLogo,
      alt: `${this.company} Logo`,
      className: "company-logo",
    });
  }

  validateAndFormatDate(dateString) {
    try {
      if (!dateString) return "No date available";

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "Invalid date";
    }
  }

  getFormattedDate() {
    return this.date;
  }

  extractCleanSalary(salaryString) {
    if (!salaryString) return null;

    const salaryRegex =
      /(\$|£)?(\d{1,3}(?:,\d{3})*)-?(\$|£)?(\d{1,3}(?:,\d{3})*)?/;
    const match = salaryString.match(salaryRegex);

    if (!match) return null;

    const cleanNumber = (num) => {
      return num ? parseInt(num.replace(/,/g, ""), 10) : null;
    };

    const currency = match[1] || match[3] || "$";

    if (match[2] && match[4]) {
      const minSalary = cleanNumber(match[2]);
      const maxSalary = cleanNumber(match[4]);
      return `${minSalary}-${maxSalary}${currency}`;
    }

    const salary = cleanNumber(match[2]);
    return `${salary}${currency}`;
  }
}

/*****************************************************************************************/
/*****************************************************************************************/
/*****************************************************************************************/

class CategoryManager {
  constructor(appIns) {
    this.app = appIns;
    this.apiEndpoint = "https://remotive.com/api/remote-jobs/categories";
    this.categories = [];
    this.chips = [];
  }

  async fetchChips() {
    try {
      const response = await fetch(this.apiEndpoint);
      if (!response.ok) throw new Error("Failed to fetch chips");

      const data = await response.json();
      this.chips = [];
      data.jobs.forEach((chip) => {
        this.chips.push(
          new Chip(
            this,
            this.app.uiManager.idManager("chip", chip),
            chip.name,
            chip.slug
          )
        );
      });

      // console.log("Fetched Chips:", this.chips);
      return this.chips;
    } catch (error) {
      this.app.handleError("fetchingChips", error.code, error.message);
      return [];
    }
  }

  async fetchCategories() {
    try {
      const response = await fetch(this.app.jobManager.apiEndpoint);
      if (!response.ok) throw new Error("Failed to fetch job categories.");

      const data = await response.json();
      // console.log(data.jobs);

      const categoryMappings = {
        job_type: "Job Type",
        company_name: "Company Name",
        candidate_required_location: "Location",
        tags: "Job Tags",
        salary: "Salary",
      };

      Object.entries(categoryMappings).forEach(([key, description]) => {
        let uniqueValues;

        switch (key) {
          case "candidate_required_location":
            uniqueValues = [
              ...new Set(
                data.jobs.flatMap((job) =>
                  job[key] ? job[key].split(",").map((loc) => loc.trim()) : []
                )
              ),
            ];
            break;

          case "salary":
            uniqueValues = [
              ...new Set(
                data.jobs
                  .map((job) => this.extractCleanSalary(job[key]))
                  .filter((salary) => salary !== null)
              ),
            ];
            break;

          default:
            uniqueValues = [
              ...new Set(
                data.jobs
                  .map((job) => job[key])
                  .filter((value) => value !== null && value !== undefined)
                  .flat()
              ),
            ];
        }

        const category = new Category(
          this,
          this.app.uiManager.idManager("category"),
          key,
          key.toLowerCase().replace(/_/g, "-"),
          uniqueValues,
          description
        );

        this.categories.push(category);
      });

      return this.categories;
    } catch (error) {
      this.app.handleError("fetchingCategories", error.code, error.message);
      return [];
    }
  }

  sortingJobs(filterKey, order = "ace") {}

  extractCleanSalary(salaryString) {
    if (!salaryString) return null;

    const salaryRegex =
      /(\$|£)?(\d{1,3}(?:,\d{3})*)-?(\$|£)?(\d{1,3}(?:,\d{3})*)?/;
    const match = salaryString.match(salaryRegex);

    if (!match) return null;

    const cleanNumber = (num) => {
      return num ? parseInt(num.replace(/,/g, ""), 10) : null;
    };

    const currency = match[1] || match[3] || "$";

    if (match[2] && match[4]) {
      const minSalary = cleanNumber(match[2]);
      const maxSalary = cleanNumber(match[4]);
      return `${minSalary}-${maxSalary}${currency}`;
    }

    const salary = cleanNumber(match[2]);
    return `${salary}${currency}`;
  }

  randomCategory() {
    if (!this.chips || this.chips.length === 0) return "QA";

    return this.chips[Math.floor(Math.random() * this.chips.length)].name;
  }

  getCategoryValues(filterKey) {
    return this.categories.find((category) => category.key === filterKey)
      ?.values;
  }

  findCategory(filterKey) {
    return this.categories.find((category) => category.key === filterKey);
  }
}

class Category {
  constructor(CategoryManager, IdCategory, Key, KeySlug, Values, Description) {
    this.categoryManager = CategoryManager;
    this.idCategory = IdCategory;
    this.key = Key;
    this.keySlug = KeySlug;
    this.values = Values;
    this.description = Description;
  }
}

class Chip {
  constructor(CategoryManager, IdChip, Name, Slug) {
    this.categoryManager = CategoryManager;
    this.idChip = IdChip;
    this.name = Name;
    this.slug = Slug;
  }
}

/*****************************************************************************************/
/*****************************************************************************************/
/*****************************************************************************************/

class FilterManager {
  constructor(appIns) {
    this.app = appIns;
    this.favoriteFilters = [];
    this.activeFilters = [];
  }

  getFavFilters() {
    const storedFavFilters =
      JSON.parse(localStorage.getItem("favoriteFilters")) || [];

    this.favoriteFilters = storedFavFilters.map(
      (filterData) =>
        new Filter(this, filterData.idFilter, filterData.key, filterData.value)
    );
    console.log("Loaded Favorite Filters:", this.favoriteFilters);

    return this.favoriteFilters;
  }

  saveFavFilters() {
    const uniqueFavoriteFilters = Array.from(
      new Set(this.favoriteFilters.map((filter) => filter.idFilter))
    ).map((idFilter) =>
      this.favoriteFilters.find((filter) => filter.idFilter === idFilter)
    );

    localStorage.setItem(
      "favoriteFilters",
      JSON.stringify(uniqueFavoriteFilters.map((filter) => filter.getFilter))
    );
    console.log("Saved Favorite Filters:", this.favoriteFilters);
  }

  toggleFavoriteFilter(filterId, filterKey, filterValue) {
    const filter = new Filter(this, filterId, filterKey, filterValue);
    const filterIndex = this.favoriteFilters.findIndex(
      (f) => f.value === filter.value && f.key === filter.key
    );

    if (filterIndex === -1) {
      this.favoriteFilters.push(filter);
      // Update heart icon in filter button
      const filterBtn = document.querySelector(`[id="${filterId}"]`);
      if (filterBtn) {
        const heartIcon = filterBtn.querySelector("ion-icon");
        if (heartIcon) {
          heartIcon.setAttribute("name", "heart");
        }
      }
    } else {
      this.favoriteFilters.splice(filterIndex, 1);
      // Update heart icon in filter button and restore original half-heart
      const filterBtn = document.querySelector(`[id="${filterId}"]`);
      if (filterBtn) {
        const heartIcon = filterBtn.querySelector("ion-icon");
        if (heartIcon) {
          heartIcon.setAttribute("name", "heart-half-outline");
        }
      }

      // Also update the regular filter's heart icon if it exists
      const regularFilter = document.querySelector(
        `.filter-btn[data-filterkey="${filterKey}"][data-filtervalue="${filterValue}"]`
      );
      if (regularFilter) {
        const regularHeartIcon = regularFilter.querySelector("ion-icon");
        if (regularHeartIcon) {
          regularHeartIcon.setAttribute("name", "heart-half-outline");
        }
      }
    }

    this.saveFavFilters();
    this.app.uiManager.favoriteFiltersUI();
  }

  filterJobsByValue(jobs, filterKey, filterValue) {
    return jobs.filter((job) => {
      if (filterKey === "salary")
        return (
          this.app.categoryManager.extractCleanSalary(job[filterKey]) ===
          filterValue
        );

      if (filterKey === "tags")
        return job[filterKey].some((tag) => tag === filterValue);

      return job[filterKey] === filterValue;
    });
  }

  toggleActiveFilter(eventTarget, id, filterKey, filterValue, isActive) {
    const filterIndex = this.activeFilters.findIndex(
      (filter) => filter.key === filterKey && filter.value === filterValue
    );

    if (isActive) {
      if (filterIndex !== -1) {
        return this.activeFilters.splice(filterIndex, 1)[0];
      }
    } else {
      if (filterIndex === -1) {
        const newFilter = new Filter(this, id, filterKey, filterValue);
        this.activeFilters.push(newFilter);
        return newFilter;
      }
    }
    console.log("Active Filters:", this.activeFilters);
  }

  findMatchingFilter(searchTerm) {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    const categories = this.app.categoryManager.categories;
    const chips = this.app.categoryManager.chips;

    for (const category of categories) {
      for (const value of category.values) {
        if (
          value.toLowerCase() === normalizedSearchTerm ||
          value.toUpperCase() === searchTerm ||
          value === searchTerm
        ) {
          return { filterKey: category.key, filterValue: value };
        }
      }
    }

    for (const chip of chips) {
      if (
        chip.name.toLowerCase() === normalizedSearchTerm ||
        chip.name.toUpperCase() === searchTerm ||
        chip.name === searchTerm
      ) {
        return { filterKey: "category", filterValue: chip.name };
      }
    }
    return { filterKey: null, filterValue: null };
  }

  isActiveFilter(filterKey, filterValue) {
    return this.activeFilters.some(
      (filter) => filter.key === filterKey && filter.value === filterValue
    );
  }
}

class Filter {
  constructor(FilterManager, IdFilter, Key, Value) {
    this.filterManager = FilterManager;
    this.idFilter = IdFilter;
    this.key = Key;
    this.value = Value;
  }

  get getFilter() {
    return {
      idFilter: this.idFilter,
      key: this.key,
      value: this.value,
    };
  }
}

/*****************************************************************************************/
/*****************************************************************************************/
/*****************************************************************************************/

async function setupApp() {
  try {
    const app = new App();
    await app.initializeApp();
    app.uiManager.uiBinding.bindEvents();

    const category = app.categoryManager.categories;
    console.log(category);

    const defaultQuery = {
      keyword: "testing",
      filterKey: "category",
      filterValue: "QA",
      limit: 4,
    };
    const jobs = await app.jobManager.fetchJobs(
      defaultQuery.keyword,
      defaultQuery.filterKey,
      defaultQuery.filterValue,
      defaultQuery.limit
    );
  } catch (error) {
    console.error("Error during app setup:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupApp();
});
