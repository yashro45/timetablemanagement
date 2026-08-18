const SUPABASE_URL = "https://sdgsvjzsviahnoryvrup.supabase.co";

const SUPABASE_KEY = "sb_publishable_aqIaiN0Ta_IuyKam6UNTAA_7fUA9dN7";


const form = document.getElementById("timetableForm");

const timetableBody =
    document.getElementById("timetableBody");

const message =
    document.getElementById("message");

const filterDay =
    document.getElementById("filterDay");


let timetableData = [];


// ------------------------------------------
// LOAD DATA
// ------------------------------------------

async function loadTimetable() {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/timetable?select=*&order=id.asc`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "Could not connect to database."
            );

        }


        timetableData = await response.json();

        displayTimetable();

    }

    catch (error) {

        console.error(error);

        message.textContent =
            "Database connection failed.";

        message.style.color = "red";

    }

}


// ------------------------------------------
// DISPLAY DATA
// ------------------------------------------

function displayTimetable() {

    timetableBody.innerHTML = "";

    const selectedDay = filterDay.value;


    let data = timetableData;


    if (selectedDay !== "All") {

        data = timetableData.filter(
            item => item.day === selectedDay
        );

    }


    if (data.length === 0) {

        timetableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No timetable entries found.
                </td>
            </tr>
        `;

        return;

    }


    data.forEach(item => {

        const row = document.createElement("tr");


        row.innerHTML = `

            <td>${item.day}</td>

            <td>${item.subject}</td>

            <td>${item.teacher}</td>

            <td>${item.room}</td>

            <td>
                ${item.start_time.substring(0, 5)}
                -
                ${item.end_time.substring(0, 5)}
            </td>

            <td>

                <button
                    class="delete-btn"
                    onclick="deleteTimetable(${item.id})"
                >
                    Delete
                </button>

            </td>

        `;


        timetableBody.appendChild(row);

    });

}


// ------------------------------------------
// ADD TIMETABLE
// ------------------------------------------

form.addEventListener("submit", async function(event) {

    event.preventDefault();


    const day =
        document.getElementById("day").value;

    const subject =
        document.getElementById("subject").value;

    const teacher =
        document.getElementById("teacher").value;

    const room =
        document.getElementById("room").value;

    const startTime =
        document.getElementById("startTime").value;

    const endTime =
        document.getElementById("endTime").value;


    if (startTime >= endTime) {

        message.textContent =
            "End time must be after start time.";

        message.style.color = "red";

        return;

    }


    const newEntry = {

        day: day,

        subject: subject,

        teacher: teacher,

        room: room,

        start_time: startTime,

        end_time: endTime

    };


    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/timetable`,
            {

                method: "POST",

                headers: {

                    "apikey": SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`,

                    "Content-Type":
                        "application/json",

                    "Prefer":
                        "return=minimal"

                },

                body: JSON.stringify(newEntry)

            }
        );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(errorText);

        }


        message.textContent =
            "Timetable added successfully!";

        message.style.color = "green";


        form.reset();


        await loadTimetable();

    }

    catch (error) {

        console.error(error);

        message.textContent =
            "Failed to add timetable.";

        message.style.color = "red";

    }

});


// ------------------------------------------
// DELETE TIMETABLE
// ------------------------------------------

async function deleteTimetable(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this entry?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response = await fetch(

            `${SUPABASE_URL}/rest/v1/timetable?id=eq.${id}`,

            {

                method: "DELETE",

                headers: {

                    "apikey": SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`

                }

            }

        );


        if (!response.ok) {

            throw new Error(
                "Delete failed."
            );

        }


        await loadTimetable();

    }

    catch (error) {

        console.error(error);

        alert(
            "Could not delete timetable entry."
        );

    }

}


// ------------------------------------------
// FILTER
// ------------------------------------------

filterDay.addEventListener(
    "change",
    displayTimetable
);


// ------------------------------------------
// START APPLICATION
// ------------------------------------------

loadTimetable();