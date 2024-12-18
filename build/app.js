"strict mode";

// const { doc } = require("prettier");

class App {
  constructor() {
    this.uiManager = new UIManager(this);
    this.jobManager = new JobManager(this);
    this.categoryManager = new CategoryManager(this);
    this.filterManager = new FilterManager(this);
    this.errorMessages = {
      initialize: "Failed to load page, try refreshing it.",
      gettingSeenJobs: "Failed to load seen jobs, try refreshing it.",
      fetchingChips: "Failed to fetch chips, try refreshing it.",
      fetchingCategories: "Failed to fetch categories, try refreshing it.",
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

      this.jobManager.getSeenJobs();

      this.filterManager.getFavFilters();

      const [chips, categories, jobs] =
        await this.uiManager.loadingManagerInit(promises);

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
    isActive
  ) {
    try {
      const jobs = await this.uiManager.loadingManagerSearch(
        this.jobManager.fetchJobs(source, filterKey, filterValue)
      );
      console.log("search");

      this.uiManager.updateUI(
        jobs,
        null,
        null,
        this.filterManager.toggleActiveFilter(
          source,
          id,
          filterKey,
          filterValue,
          isActive
        ),
        filterKey,
        filterValue
      );
      console.log("The Active Filter Are:", this.filterManager.activeFilters);
      this.uiManager.updateUISelected(eventTarget, source, id, isActive);

      return jobs;
    } catch (error) {
      this.handleError("initialize", error.code, error.message);
    }
  }

  handleError(errorEvent, code, msg) {
    console.error(
      `Error occurred, event: ${errorEvent}  , message: ${msg}, code: ${code}`
    );

    const message =
      this.errorMessages[errorEvent] || "An unknown error occurred.";
    this.uiManager.displayError(message);
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
    this.uiTheme = new UITheme(this);
    this.uiBinding = new UIBinding(this);
    this.uiOverlay = new UIOverlay(this);
  }

  idManager(target, jobOrChip) {
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

  displayError(errorEvent) {}

  toggleFiltersPanel(isMobile) {}

  showLoadingInit() {
    this.uiBinding.loadingSkeltonJobs.classList.remove("hidden");
    this.uiBinding.loadingSkeltonChips.classList.remove("hidden");
  }

  hideLoadingInit() {
    this.uiBinding.loadingSkeltonJobs.classList.add("hidden");
    this.uiBinding.loadingSkeltonChips.classList.add("hidden");
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
    this.uiBinding.loadingSkeltonJobs.classList.remove("hidden");
  }

  hideLoadingSearch() {
    this.uiBinding.loadingSkeltonJobs.classList.add("hidden");
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

  favoriteFiltersUI(favFilter, addRemove) {
    switch (addRemove) {
      case "remove":
        break;

      case "add":
        break;
    }
  }

  seenJobsUI(seenJob, addRemove) {
    switch (addRemove) {
      case "remove":
        break;

      case "add":
        break;
    }
  }

  updateUI(jobs, categories, chips, filter, filterKey, filterValue) {
    jobs ? this.uiRendering.renderJobs(jobs, filterKey, filterValue) : null;

    filter && categories
      ? this.uiRendering.renderFilters(categories, filter)
      : null;

    chips ? this.uiRendering.renderChips(chips) : null;
  }

  updateUISelected(eventTarget, source, idSource, isActive) {
    switch (source) {
      case "chip":
        !isActive
          ? (eventTarget.classList = `
        chip whitespace-nowrap max-w-min font-lighter opacity-100 laptop:px-3 laptop:py-2 px-2 py-1 rounded-xl dark:bg-slate-3 bg-amber-3 text-[1rem] laptop:text-sm laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-amber-4 dark:hover:bg-slate-4 dark:text-slate-11 ACTIVE`)
          : (eventTarget.classList = `chip whitespace-nowrap max-w-min font-lighter opacity-80 laptop:px-3 laptop:py-2 px-2 py-1 rounded-xl dark:bg-slate-10 bg-[#F0E8DB] text-[1rem] laptop:text-sm laptop:font-lighter cursor-pointer hover:opacity-100 transition-all duration-fast hover:bg-[#e4d7c2] dark:hover:bg-slate-11`);

        break;

      case "filter":
        // Add logic for updating the filter's UI if needed

        break;

      case "searchbar":
        return;
    }
  }
}

class UIRendering {
  constructor(UIManagerIns) {
    this.uiManager = UIManagerIns;
  }

  renderJobs(jobs, filterKey, filterValue) {
    jobs.forEach((job) => {
      const [tag1, tag2, tag3, tag4] = job.tags;

      const HTML = `
            <div
              class="job tablet:text-xxs text-[0.9rem] min-w-full rounded-3xl tablet:rounded-[10rem] bg-amber-2 dark:bg-slate-11 px-6 py-3 pl-3 border-2 border-slate-3 backdrop-opacity-60 shadow-[0_0_0.2rem_0_rgba(0,0,0,0.1)] dark:border-opacity-40 max-h-fit tablet:max-h-8 leading-6 flex items-center justify-center transition-all duration-fast hover:bg-amber-3 dark:hover:bg-slate-9"
              id="${job.jobId}"
              data-filterkey="${filterKey}"
              data-filtervalue="${filterValue}"
            >
              <div
                class="grid tablet:grid-cols-[fit-content(100%)_1fr_fit-content(100%)] grid-cols-[fit-content(100%)_1fr] grid-rows-[1fr_fit-content(100%)] tablet:grid-rows-none items-center min-w-full gap-3 tablet:py-3 gap-y-1 cursor-pointer group"
                href="${job.jobUrl}"
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
                    href="The Link For the Job"
                    class="px-2 py-1 tablet:px-3 tablet:py-2 rounded-3xl bg-amber-11 text-slate-1 hover:bg-amber-10 duration-fast transition-all drop-shadow-sm tablet:text-[1rem] hover:ring-4 ring-slate-2 ring-opacity-80"
                    >Apply</a
                  >
                  <ion-icon
                    name="eye-outline"
                    class="text-sm hover:scale-125 duration-fast transition-all cursor-pointer"
                  ></ion-icon>
                </div>
              </div>
            </div>
              `;
      this.uiManager.uiBinding.jobContainer.innerHTML += HTML;
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

  // Logic for implementing into the HTML the data
  renderFilters(categories, filter) {
    // Logic for creating the filters
    categories;
    //
    // The filter-btn must contain an filterId
    // The filter-panel must contain a dataSet of filterKey
    // The filter-btn must contain a dataSet of filterValue
    //
    // Logic for searching and activate searching
    filter;
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
    this.chipsContainer = this.safeQuerySelector("#chips-container");
    this.filterPanel = this.safeQuerySelectorAll(".filter-panel");
    this.jobContainer = this.safeQuerySelector("#jobs-container");
    this.loadingSkeltonJobs = this.safeQuerySelector("#loading-skelton-jobs");
    this.loadingSkeltonChips = this.safeQuerySelector("#loading-skelton-chips");
    this.favFiltersContainer = this.safeQuerySelector(
      "#favorite-filters-container"
    );
    this.seenJobBtn = this.safeQuerySelectorAll(".seen-job-btn");
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
    this.searchBarSearchBtn.addEventListener("click", (e) =>
      this.uiManager.app.handleSearchingEvent(
        "_",
        "searchbar",
        e.target?.dataset?.filterkey,
        e.target?.dataset?.filtervalue,
        e.target?.id,
        "_"
      )
    );

    this.chipsContainer.addEventListener("click", (e) => {
      const chipElement = e.target.closest(".chip");
      console.log(chipElement);

      this.uiManager.app.handleSearchingEvent(
        e.target,
        "chip",
        chipElement?.dataset?.filterkey,
        chipElement?.dataset?.filtervalue,
        chipElement?.id,
        chipElement?.classList.contains("ACTIVE") ? true : false
      );
    });

    this.filterPanel.forEach((panel) =>
      panel.addEventListener("click", (e) => {
        const filterPanel = e.target.closest(".filter-panel");
        const filterBtn = e.target.closest(".filter-btn");

        this.uiManager.app.handleSearchingEvent(
          e.target,
          "filter",
          filterPanel?.dataset?.filterkey,
          filterBtn?.dataset?.filtervalue,
          filterBtn?.id,
          filterBtn?.classList.contains("ACTIVE") ? true : false
        );
      })
    );

    this.jobContainer.addEventListener("click", (e) => {
      const seenJobBtn = e.target.closest(".seen-job-btn");

      this.uiManager.app.jobManager.handleJobSeen(seenJobBtn?.dataset?.jobId);
    });

    this.favFiltersContainer.addEventListener("click", (e) => {
      const favoriteFilterBtn = e.target.closest(".favorite-filter-btn");

      this.uiManager.app.filterManager.toggleFavoriteFilter(
        favoriteFilterBtn?.dataset?.filterId,
        favoriteFilterBtn?.dataset?.filterKey,
        favoriteFilterBtn?.dataset?.filterValue
      );
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

    this.sortingOptions;

    this.loadingSkeltonJobs;
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
/*****************************************************************************************/
/*****************************************************************************************/
/*****************************************************************************************/

class JobManager {
  constructor(appIns) {
    this.app = appIns;
    this.apiEndpoint = "https://remotive.com/api/remote-jobs";
    this.jobs = [];
    this.seenJobs = this.getSeenJobs();
  }

  async fetchJobs(source, filterKey, filterValue, limit = 4) {
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
          j.tags
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
          jobData.salary
        )
    );

    return this.seenJobs;
  }

  saveSeenJobs() {
    const uniqueSeenJobs = Array.from(
      new Set(this.seenJobs.map((job) => job.idJob))
    ).map((idJob) => this.seenJobs.find((job) => job.idJob === idJob));

    localStorage.setItem(
      "seenJobs",
      JSON.stringify(uniqueSeenJobs.map((job) => job.getJob))
    );
  }

  toggleJobSeen(job) {
    const jobIndex = this.seenJobs.findIndex(
      (seenJob) => seenJob.idJob === job.idJob
    );

    jobIndex === -1
      ? (this.seenJobs.push(job), (job.isSeen = true))
      : (this.seenJobs.splice(jobIndex, 1), (job.isSeen = false));

    this.app.uiManager.seenJobsUI(job, jobIndex === -1 ? "add" : "remove");

    this.saveSeenJobs();
  }

  handleJobSeen(jobId) {
    const job = this.jobs.find((j) => j.idJob === jobId);
    job ? this.toggleJobSeen(job) : null;
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
    Tags
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
    this.publicationDate = this.getFormattedDate(PostingDate);
    this.tags = Tags;
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

  getFormattedDate(date) {
    return new Intl.DateTimeFormat(navigator.language, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
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
      this.app.handleError(fetchingCategories, error.code, error.message);
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
  }

  toggleFavoriteFilter(filterId, filterKey, filterValue) {
    const filter = new Filter(this, filterId, filterKey, filterValue);
    const filterIndex = this.favoriteFilters.findIndex(
      (f) => f.idFilter === filter.idFilter
    );

    filterIndex === -1
      ? this.favoriteFilters.push(filter)
      : this.favoriteFilters.splice(filterIndex, 1);

    this.app.uiManager.favoriteFiltersUI(
      filter,
      filterIndex === -1 ? "add" : "remove"
    );

    this.saveFavFilters();
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

  toggleActiveFilter(source, id, filterKey, filterValue, isActive) {
    const filterIndex = this.activeFilters.findIndex(
      (filter) => filter.filterId === id
    );
    return isActive
      ? this.activeFilters.splice(filterIndex, 1)[0]
      : (this.activeFilters.push(
          new Filter(
            this,
            source === "chip" ? id : this.app.uiManager.idManager("filter"),
            filterKey,
            filterValue
          )
        ),
        this.activeFilters[this.activeFilters.length - 1]);
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

    const chip = app.categoryManager.chips[0];
    // console.log(chip);

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

    console.log("Testing Jobs:", jobs);
  } catch (error) {
    console.error("Error during app setup:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupApp();
});
