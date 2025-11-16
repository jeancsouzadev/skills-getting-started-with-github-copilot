document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message and existing options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML (no bullets). Add a small remove button for each participant.
        const participantsHtml = details.participants && details.participants.length
          ? `<ul class="participants" data-activity="${encodeURIComponent(name)}">${details.participants.map(p => `<li data-email="${p}">${p} <button class=\"participant-remove\" title=\"Unregister\">✖</button></li>`).join("")}</ul>`
          : `<ul class="participants" data-activity="${encodeURIComponent(name)}"><li class="no-participants">No participants yet.</li></ul>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            <p class="participants-title"><strong>Participants</strong></p>
            ${participantsHtml}
          </div>
        `;

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

    // Delegate click events for remove buttons on participants
    activitiesList.addEventListener('click', async (event) => {
      const btn = event.target.closest('.participant-remove');
      if (!btn) return;

      const li = btn.closest('li');
      const ul = btn.closest('ul.participants');
      if (!li || !ul) return;

      const email = li.dataset.email;
      const activityName = decodeURIComponent(ul.dataset.activity || '');

      if (!email || !activityName) return;

      try {
        const response = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // remove li from DOM
          li.remove();

          // if no participants remain, show fallback message
          const remaining = ul.querySelectorAll('li');
          if (!remaining.length) {
            ul.innerHTML = '<li class="no-participants">No participants yet.</li>';
          }
        } else {
          const result = await response.json().catch(() => ({}));
          alert(result.detail || 'Failed to unregister participant');
        }
      } catch (err) {
        console.error('Error unregistering participant:', err);
        alert('Failed to unregister participant. Please try again.');
      }
    });

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
        // ensure base class "message" is preserved along with success
        messageDiv.className = "message success";
        messageDiv.textContent = result.message;
        signupForm.reset();
        // refresh activities to show updated participants and wait for it to complete
        await fetchActivities();
      } else {
        messageDiv.className = "message error";
        messageDiv.textContent = result.detail || "An error occurred";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.className = "message error";
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
