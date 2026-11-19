"use strict";

renderSharedLayout("browse");

// Read information from URL
const params = new URLSearchParams(window.location.search);

const petId = params.get("petId");
const shelterId = params.get("shelterId");
const petName = params.get("petName");
const petType = params.get("petType");
const petBreed = params.get("petBreed");

const adoptionFeeValue = params.get("adoptionFee");
const processingFeeValue = params.get("processingFee");

const adoptionFee = Number(adoptionFeeValue);
const processingFee = Number(processingFeeValue);

const validApplicationPet =
  Boolean(petId) &&
  Boolean(shelterId) &&
  Boolean(petName) &&
  Boolean(petType) &&
  Boolean(petBreed) &&
  adoptionFeeValue !== null &&
  processingFeeValue !== null &&
  adoptionFeeValue.trim() !== "" &&
  processingFeeValue.trim() !== "" &&
  Number.isFinite(adoptionFee) &&
  Number.isFinite(processingFee) &&
  adoptionFee >= 0 &&
  processingFee >= 0;

const applicationContent =
  document.querySelector("#application-content");

const successSection =
  document.querySelector("#application-success");

if (!validApplicationPet)
{
  applicationContent.replaceChildren();

  const panel = document.createElement("section");
  panel.className = "form-panel centered";

  panel.innerHTML = `
    <h2 class="section-heading">
      Application Information Missing
    </h2>

    <p>
      We could not identify the selected pet or its fees.
    </p>

    <a class="button" href="/browse">Browse Pets</a>
  `;

  applicationContent.appendChild(panel);
}
else
{
  const petSummary = document.querySelector("#application-pet");
  const totalFee = adoptionFee + processingFee;

  petSummary.innerHTML = `
    <p class="eyebrow">Your selected companion</p>

    <h2>${escapeHTML(petName)}</h2>

    <p><strong>Type:</strong> ${escapeHTML(petType)}</p>
    <p><strong>Breed:</strong> ${escapeHTML(petBreed)}</p>

    <table class="fee-table">
      <tbody>
        <tr>
          <td>Adoption fee</td>
          <td>${formatMoney(adoptionFee)}</td>
        </tr>

        <tr>
          <td>Processing fee</td>
          <td>${formatMoney(processingFee)}</td>
        </tr>

        <tr class="fee-total">
          <td>Total before taxes</td>
          <td>${formatMoney(totalFee)}</td>
        </tr>
      </tbody>
    </table>

    <p id="application-total"></p>
  `;

  const form = document.querySelector("#adoption-form");
  const submitButton =
    document.querySelector("#submit-application");

  const careAgreement =
    document.querySelector("#care-agreement");

  const adoptionUnderstanding =
    document.querySelector("#adoption-understanding");

  const donationSelect = document.querySelector("#donation");
  const totalDisplay =
    document.querySelector("#application-total");

  function updateSubmitButton()
  {
    submitButton.disabled =
      !(careAgreement.checked &&
        adoptionUnderstanding.checked);
  }

  function updateDonationTotal()
  {
    const donation = Number(donationSelect.value);

    totalDisplay.textContent =
      `Total including optional donation, before taxes: ${
        formatMoney(totalFee + donation)
      }`;
  }

  careAgreement.addEventListener("change", updateSubmitButton);
  adoptionUnderstanding.addEventListener(
    "change", updateSubmitButton
  );

  donationSelect.addEventListener("change", updateDonationTotal);

  // Submit application to server
  form.addEventListener("submit", event =>
  {
    event.preventDefault();

    if (!careAgreement.checked ||
        !adoptionUnderstanding.checked)
    {
      updateSubmitButton();
      return;
    }

    if (!form.reportValidity())
    {
      return;
    }

    // Collect application info
    const application =
    {
      petId: petId,
      shelterId: shelterId,
      petType: petType,

      name: document.querySelector("#full-name").value.trim(),
      email: document.querySelector("#email").value.trim(),
      phone: document.querySelector("#phone").value.trim(),
      address: document.querySelector("#address").value.trim(),

      residents: document.querySelector("#residents").value,
      currentPets: document.querySelector("#current-pets").value,
      experience: document.querySelector("#experience").value,

      location: document.querySelector("#living-location").value,
      donation: donationSelect.value
    };

    submitButton.disabled = true;

    // Send application using POST
    fetch("/submitapplication",
    {
      method: "POST",
      headers:
      {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(application)
    })
      .then(response =>
      {
        if (!response.ok)
        {
          throw new Error("Application submission failed.");
        }

        return response.json();
      })
      .then(data =>
      {
        // Only show success after server confirmation
        applicationContent.remove();

        successSection.hidden = false;

        successSection.innerHTML = `
          <p class="eyebrow">Thank you for caring</p>

          <h2 class="section-heading">
            Application Submitted Successfully!
          </h2>

          <p>
            Thank you, ${escapeHTML(application.name)},
            for submitting your adoption application for
            ${escapeHTML(petName)}.
          </p>

          <p>
            Your application will be reviewed by our adoption team,
            and you will be contacted soon.
          </p>

          <p>
            Your application ID is:
            <strong>${escapeHTML(data.applicationId)}</strong>
          </p>

          <a href="/" class="button">Return to Home</a>
        `;

        window.scrollTo(0, 0);
      })
      .catch(error =>
      {
        console.error(error);

        document.querySelector("#form-message").textContent =
          "There was an error submitting your application. Please try again.";

        submitButton.disabled = false;
      });
  });

  updateSubmitButton();
  updateDonationTotal();
}