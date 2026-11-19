"use strict";

// Set up shared page layout
renderSharedLayout("browse");

const shelterSelect = document.querySelector("#shelter-select");
const contentContainer = document.querySelector("#shelter-pet-content");
const selectMessage = document.querySelector("#select-shelter-message");
const filterButtons = document.querySelectorAll(".filter-button");
const petGrid = document.querySelector("#pet-grid");
const resultsSummary = document.querySelector("#results-summary");

let shelters = [];
let selectedShelter = null;
let selectedCategory = "All";

// Request basic shelter information from the server
function loadShelters()
{
  fetch("/shelters")
    .then(response =>
    {
      if (!response.ok)
      {
        throw new Error("Could not load shelters.");
      }

      return response.json();
    })
    .then(data =>
    {
      shelters = data;

      // Populate shelter dropdown
      shelters.forEach(shelter =>
      {
        const option = document.createElement("option");
        option.value = shelter.id;
        option.textContent =
          `${shelter.name} (${shelter.city})`;

        shelterSelect.appendChild(option);
      });

      // Restore the selected shelter when returning from another page
      const params = new URLSearchParams(window.location.search);
      const returnShelterId = params.get("shelterId");

      if (returnShelterId &&
          shelters.some(item => item.id === returnShelterId))
      {
        shelterSelect.value = returnShelterId;
        loadSelectedShelter(returnShelterId);
      }
      else
      {
        shelterSelect.value = "";
        contentContainer.hidden = true;
        selectMessage.hidden = false;
      }
    })
    .catch(error =>
    {
      selectMessage.textContent =
        "Unable to load shelters. Please try again later.";

      console.error(error);
    });
}

// Request the complete info for a selected shelter
function loadSelectedShelter(shelterId)
{
  // Discard the previous shelter's info
  selectedShelter = null;
  petGrid.replaceChildren();
  contentContainer.hidden = true;

  fetch(`/shelters?id=${encodeURIComponent(shelterId)}`)
    .then(response =>
    {
      if (!response.ok)
      {
        throw new Error("Could not load selected shelter.");
      }

      return response.json();
    })
    .then(shelter =>
    {
      selectedShelter = shelter;
      renderPets();
    })
    .catch(error =>
    {
      contentContainer.hidden = true;
      selectMessage.hidden = false;
      selectMessage.textContent =
        "Unable to load this shelter's pets.";

      console.error(error);
    });
}

// Update available filter buttons
function updateFilterButtons(shelter)
{
  filterButtons.forEach(button =>
  {
    const category = button.dataset.category;

    const hasPets = category === "All" ||
      shelter.pets.some(
        pet => getPetCategory(pet.type) === category
      );

    const isSelected = category === selectedCategory;

    button.disabled = !hasPets;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

// Display pets belonging to the selected shelter
function renderPets()
{
  const shelter = selectedShelter;

  if (!shelter)
  {
    contentContainer.hidden = true;
    selectMessage.hidden = false;
    petGrid.replaceChildren();
    return;
  }

  contentContainer.hidden = false;
  selectMessage.hidden = true;

  updateFilterButtons(shelter);

  const filteredPets = shelter.pets.filter(pet =>
  {
    return selectedCategory === "All" ||
      getPetCategory(pet.type) === selectedCategory;
  });

  resultsSummary.textContent =
    `${shelter.name} — ${filteredPets.length} ` +
    `${filteredPets.length === 1 ? "pet" : "pets"} available`;

  petGrid.replaceChildren();

  filteredPets.forEach(pet =>
  {
    const card = document.createElement("article");
    card.className = "pet-card";

    const image = document.createElement("img");
    image.src = "/" + pet.image;
    image.alt = `Photo of ${pet.name}`;
    image.width = 120;
    image.height = 120;
    image.loading = "lazy";

    const name = document.createElement("h3");
    name.textContent = pet.name;

    const description = document.createElement("p");
    description.textContent = `${pet.breed} · ${pet.type}`;

    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "button";
    detailsButton.textContent = "View Details";

    detailsButton.addEventListener("click", () =>
    {
      const query = new URLSearchParams(
      {
        petId: pet.id,
        shelterId: shelter.id
      });

      window.location.href = `/details?${query.toString()}`;
    });

    card.append(image, name, description, detailsButton);
    petGrid.appendChild(card);
  });
}

// When the selected shelter changes
shelterSelect.addEventListener("change", () =>
{
  selectedCategory = "All";

  if (shelterSelect.value === "")
  {
    selectedShelter = null;
    renderPets();
    return;
  }

  loadSelectedShelter(shelterSelect.value);
});

// Category filter buttons
filterButtons.forEach(button =>
{
  button.addEventListener("click", () =>
  {
    if (button.disabled)
    {
      return;
    }

    selectedCategory = button.dataset.category;
    renderPets();
  });
});

// Start loading shelter information
loadShelters();