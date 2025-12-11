document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select, keep placeholder
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          // Build participants section with delete buttons
          const participantsDiv = document.createElement("div");
          participantsDiv.className = "participants";

          const title = document.createElement("strong");
          title.textContent = "Participants:";
          participantsDiv.appendChild(title);

          if (Array.isArray(details.participants) && details.participants.length > 0) {
            const ul = document.createElement("ul");
            ul.className = "participants-list";

            details.participants.forEach((p) => {
              const li = document.createElement("li");
              li.className = "participant-item";

              const span = document.createElement("span");
              span.className = "participant-email";
              span.textContent = p;

              const delBtn = document.createElement("button");
              delBtn.className = "participant-delete";
              delBtn.setAttribute("aria-label", `Remove ${p}`);
              delBtn.title = `Remove ${p}`;
              delBtn.innerHTML = "&times;";

              delBtn.addEventListener("click", async () => {
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                    { method: "DELETE" }
                  );

                  const result = await resp.json().catch(() => ({}));

                  if (resp.ok) {
                    messageDiv.textContent = result.message || "Participant removed";
                    messageDiv.className = "success";
                    messageDiv.classList.remove("hidden");
                    // Refresh list
                    await fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "Failed to remove participant";
                    messageDiv.className = "error";
                    messageDiv.classList.remove("hidden");
                  }

                  // hide message after 4s
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } catch (err) {
                  console.error("Error removing participant:", err);
                  messageDiv.textContent = "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                }
              });

              li.appendChild(span);
              li.appendChild(delBtn);
              ul.appendChild(li);
            });

            participantsDiv.appendChild(ul);
          } else {
            const pNo = document.createElement("p");
            pNo.className = "no-participants";
            pNo.textContent = "No participants yet";
            participantsDiv.appendChild(pNo);
          }

          activityCard.appendChild(participantsDiv);
          activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so UI shows updated participants/availability
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
