"strict mode";

class App {
  constructor() {
    this.uiManager = new UIManager(this);
    this.jobManager = new JobManager(this);
    this.categoryManager = new CategoryManager(this);
    this.filterManager = new FilterManager(this);
    this.theme = "light";
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
  // TODO: 1. Use handleError across all the code
  // TODO: 2. Start HTML

  async initializeApp() {
    try {
      const chipPromise = await this.categoryManager.fetchChips();

      const promises = Promise.all([
        Promise.resolve(chipPromise),
        this.categoryManager.fetchCategories(),
        this.jobManager.fetchJobs(
          "init",
          "category",
          this.categoryManager.randomCategory()
        ),
      ]);

      this.jobManager.getSeenJobs();

      this.filterManager.getFavFilters();

      const [chips, categories, jobs] = await this.uiManager.loadingManager(
        promises
      );

      this.uiManager.updateUI(jobs, categories, chips);
    } catch (error) {
      this.handleError("initialize", error.code, error.message);
    }
  }

  async handleSearchingEvent(source, filterKey, filterValue) {
    try {
      const jobs = await this.uiManager.loadingManager(
        this.jobManager.fetchJobs(source, filterKey, filterValue)
      );

      this.uiManager.updateUI(
        jobs,
        null,
        null,
        this.filterManager.addActiveFilter(filterKey, filterValue)
      );

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

  toggleTheme() {}

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
    this.searchBarSearch = document.getElementById("search-bar-search");
    this.chipsContainer = document.getElementById("chips-container");
    this.filterPanel = document.querySelectorAll(".filter-panel");
    this.jobContainer = document.getElementById("jobs-container");
    this.loadingSkelton = document.getElementById("loading-skelton");
    this.favFiltersContainer = document.getElementById(
      "favorite-filters-container"
    );
    this.seenJobBtn = document.querySelectorAll(".seen-job-btn");
    this.favFiltersBtn = document.querySelectorAll(".favorite-filter-btn");
    this.sortingOptions = document.getElementById("sorting-options");
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

  // Logic for implementing into the HTML the data
  renderJobs(jobs) {
    // The job card must contains a dataSet of jobId
    // The job card must contain a dataSet of filterKey
    // The job card must contain a dataSet of filterValue
  }

  // Logic for implementing into the HTML the data
  renderChips(chips) {
    this.chipsContainer.innerHTML = chips.length
      ? chips
          .map(
            (chip) => `
          <div 
            class="chip" 
            data-chip-id="${chip.idChip}" 
            data-chip-slug="${chip.slug}"
          >
            ${chip.name}
          </div>
        `
          )
          .join("")
      : '<p class="no-chips-message">No chips available</p>';
    // The chip must contain an chipId
    // The chip must contain a dataSet of filterKey
    // The chip must contain a dataSet of filterValue
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
    //
    // Logic for searching and activate searching
    filter;
  }

  showLoading() {
    this.loadingSkelton.classList.add("loading");
  }

  hideLoading() {
    this.loadingSkelton.classList.remove("loading");
  }

  loadingManager(promise) {
    this.showLoading();
    return promise
      .then((result) => {
        this.hideLoading();
        return result;
      })
      .catch((error) => {
        this.hideLoading();
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

  bindEvents() {
    this.searchBarSearch.addEventListener("click", (e) =>
      this.app.handleSearchingEvent(
        "searchBar",
        e.target?.dataset?.filterKey,
        e.target?.dataset?.filterValue
      )
    );

    this.chipsContainer.addEventListener("click", (e) => {
      const chipElement = e.target.closest(".chip");

      this.app.handleSearchingEvent(
        "chip",
        chipElement?.dataset?.filterKey,
        chipElement?.dataset?.filterValue
      );
    });

    this.filterPanel.addEventListener("click", (e) => {
      const filterPanel = e.target.closest(".filter-panel");
      const filterBtn = e.target.closest(".filter-btn");

      this.app.handleSearchingEvent(
        "filter",
        filterPanel?.dataset?.filterKey,
        filterBtn?.dataset?.filterValue
      );
    });

    this.jobContainer.addEventListener("click", (e) => {
      const seenJobBtn = e.target.closest(".seen-job-btn");

      this.app.jobManager.handleJobSeen(seenJobBtn?.dataset?.jobId);
    });

    this.favFiltersContainer.addEventListener("click", (e) => {
      const favoriteFilterBtn = e.target.closest(".favorite-filter-btn");

      this.app.filterManager.toggleFavoriteFilter(
        favoriteFilterBtn?.dataset?.filterId,
        favoriteFilterBtn?.dataset?.filterKey,
        favoriteFilterBtn?.dataset?.filterValue
      );
    });

    this.sortingOptions;

    this.loadingSkelton;
  }

  updateUI(jobs, categories, chips, filter) {
    jobs ? this.renderJobs(jobs) : null;

    filter && categories ? this.renderFilters(categories, filter) : null;

    chips ? this.renderChips(chips) : null;
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

      // console.log("Fetched Jobs:", filteredJobs);

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
          j.companyLogo,
          j.publication_date,
          j.description,
          j.salary
        );

        this.jobs.push(job);
      });

      // console.log("Jobs instances:", this.jobs);
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
    Salary
  ) {
    this.jobManager = JobManager;
    this.idJob = IdJob;
    this.title = Title;
    this.jobUrl = JobUrl;
    this.jobFormat = JobFormat;
    this.company = Company;
    this.location = Location;
    this.isSeen = false;
    this.companyLogo = CompanyLogo;
    this.postingDate = PostingDate;
    this.description = Description;
    this.salary = Salary;
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

  getFormattedDate() {
    return new Intl.DateTimeFormat(navigator.language, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(this.postingDate));
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

      // ! TEMP
      this.app.uiManager.renderChips(this.chips);

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

      // console.log("Fetched Categories:", this.categories);
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

  addActiveFilter(filterKey, filterValue) {
    return this.activeFilters.some(
      (filter) => filter.key === filterKey && filter.value === filterValue
    )
      ? this.activeFilters.find(
          (filter) => filter.key === filterKey && filter.value === filterValue
        )
      : this.activeFilters.push(
          new Filter(
            this,
            this.app.uiManager.idManager("filter"),
            filterKey,
            filterValue
          )
        ) && this.activeFilters[this.activeFilters.length - 1];
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
  const app = new App();
  await app.initializeApp();

  const jobs = await app.jobManager.fetchJobs("testing", "tags", "react", 4);
  console.log("Testing Jobs:", jobs);

  // app.filterManager.toggleFavoriteFilter(232323, "category", "QA");
  // app.jobManager.handleJobSeen(jobs[0].idJob);

  console.log("The seenJobs are:", app.jobManager.getSeenJobs());
  console.log("The favoriteFilters are:", app.filterManager.getFavFilters());
}

setupApp();
