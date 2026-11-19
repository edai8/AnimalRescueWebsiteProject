"use strict";

// Build the shared page layout
renderSharedLayout("about");

// Display the mission statement from file
document.querySelector("#mission-text").textContent =
  aboutData.mission;

// Display the team introduction from data file
document.querySelector("#team-description").textContent =
  aboutData.teamDescription;

// Create one card for each team member
const teamGrid = document.querySelector("#team-grid");

teamGrid.replaceChildren();

aboutData.team.forEach(member =>
{
  const card = document.createElement("article");
  card.className = "team-card";

  const name = document.createElement("h3");
  name.textContent = member.name;

  const role = document.createElement("p");
  role.className = "team-role";
  role.textContent = member.role;

  const experience = document.createElement("p");
  const experienceLabel = document.createElement("strong");
  experienceLabel.textContent = "Experience: ";
  experience.append(experienceLabel, member.experience);

  const qualifications = document.createElement("p");
  const qualificationsLabel = document.createElement("strong");
  qualificationsLabel.textContent = "Qualifications: ";
  qualifications.append(
    qualificationsLabel,
    member.qualifications
  );

  card.append(name, role, experience, qualifications);
  teamGrid.appendChild(card);
});