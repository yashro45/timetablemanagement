const SUPABASE_URL =
    "https://sdgsvjzsviahnoryvrup.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_aqIaiN0Ta_IuyKam6UNTAA_7fUA9dN7";


/* ========================= */
/* ELEMENTS */
/* ========================= */

const form =
    document.getElementById("timetableForm");

const timetableBody =
    document.getElementById("timetableBody");

const message =
    document.getElementById("message");

const filterDay =
    document.getElementById("filterDay");

const subjectInput =
    document.getElementById("subject");

const subjectCounter =
    document.getElementById("subjectCounter");

const classTypeInput =
    document.getElementById("classType");

const editingId =
    document.getElementById("editingId");

const submitBtn =
    document.getElementById("submitBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const formTitle =
    document.getElementById("formTitle");

const editingStatus =
    document.getElementById("editingStatus");

const weeklyBody =
    document.getElementById("weeklyBody");

const teacherGrid =
    document.getElementById("teacherGrid");


let timetableData = [];


/* ========================= */
/* DAYS */
/* ========================= */

const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];


/* ========================= */
/* INITIAL LOAD */
/* ========================= */

loadTimetable();


/* ========================= */
/* LOAD DATA */
/* ========================= */

async function loadTimetable() {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/timetable?select=*&order=id.asc`,
            {
                headers: {
                    "apikey": SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SUPABASE_KEY}`
                }
            }
        );


        if (!response.ok) {

            throw new Error(
                "Could not connect to database."
            );

        }


        timetableData =
            await response.json();


        displayTimetable();

        updateStatistics();

        displayWeeklyTimetable();

        displayTeacherDirectory();

    }

    catch (error) {

        console.error(error);

        showMessage(
            "Database connection failed.",
            "red"
        );

    }

}


/* ========================= */
/* DISPLAY MANAGEMENT TABLE */
/* ========================= */

function displayTimetable() {

    timetableBody.innerHTML = "";


    const selectedDay =
        filterDay.value;


    let data =
        timetableData;


    if (selectedDay !== "All") {

        data =
            timetableData.filter(
                item =>
                    item.day === selectedDay
            );

    }


    if (data.length === 0) {

        timetableBody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;padding:30px;color:#64748b;">
                    No timetable entries found.
                </td>
            </tr>
        `;

        return;

    }


    data.forEach(item => {

        const row =
            document.createElement("tr");


        const type =
            item.class_type || "Theory";


        const badgeClass =
            type === "Lab"
                ? "lab-badge"
                : "theory-badge";


        const badgeIcon =
            type === "Lab"
                ? "🧪"
                : "🎓";


        row.innerHTML = `

            <td>
                <strong>${escapeHTML(item.day)}</strong>
            </td>

            <td>
                ${escapeHTML(item.subject)}
            </td>

            <td>
                ${formatTeacherForTimetable(
                    item.teacher
                )}
            </td>

            <td>
                ${escapeHTML(item.room)}
            </td>

            <td>
                <span class="type-badge ${badgeClass}">
                    ${badgeIcon}
                    ${type}
                </span>
            </td>

            <td>
                ${formatTime(item.start_time)}
                -
                ${formatTime(item.end_time)}
            </td>

            <td>

                <div class="action-buttons">

                    <button
                        class="edit-btn"
                        onclick="editTimetable(${item.id})"
                    >
                        ✏ Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteTimetable(${item.id})"
                    >
                        Delete
                    </button>

                </div>

            </td>
        `;


        timetableBody.appendChild(row);

    });

}


/* ========================= */
/* ADD / EDIT */
/* ========================= */

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const day =
            document.getElementById("day").value;

        const subject =
            document.getElementById("subject").value.trim();

        const teacher =
            document.getElementById("teacher").value.trim();

        const room =
            document.getElementById("room").value.trim();

        const startTime =
            document.getElementById("startTime").value;

        const endTime =
            document.getElementById("endTime").value;

        const classType =
            classTypeInput.value;


        /* SUBJECT WORD LIMIT */

        const wordCount =
            countWords(subject);


        if (wordCount > 9) {

            showMessage(
                "Subject cannot contain more than 9 words.",
                "red"
            );

            return;

        }


        /* TIME VALIDATION */

        if (startTime >= endTime) {

            showMessage(
                "End time must be after start time.",
                "red"
            );

            return;

        }


        /* TEACHER VALIDATION */

        if (!teacher) {

            showMessage(
                "Please enter teacher name.",
                "red"
            );

            return;

        }


        const entry = {

            day: day,

            subject: subject,

            teacher: teacher,

            room: room,

            start_time: startTime,

            end_time: endTime,

            class_type: classType

        };


        try {

            let response;


            /* EDIT */

            if (editingId.value) {

                response =
                    await fetch(
                        `${SUPABASE_URL}/rest/v1/timetable?id=eq.${editingId.value}`,
                        {

                            method: "PATCH",

                            headers: {

                                "apikey":
                                    SUPABASE_KEY,

                                "Authorization":
                                    `Bearer ${SUPABASE_KEY}`,

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(entry)

                        }
                    );

            }


            /* ADD */

            else {

                response =
                    await fetch(
                        `${SUPABASE_URL}/rest/v1/timetable`,
                        {

                            method: "POST",

                            headers: {

                                "apikey":
                                    SUPABASE_KEY,

                                "Authorization":
                                    `Bearer ${SUPABASE_KEY}`,

                                "Content-Type":
                                    "application/json",

                                "Prefer":
                                    "return=minimal"

                            },

                            body:
                                JSON.stringify(entry)

                        }
                    );

            }


            if (!response.ok) {

                const errorText =
                    await response.text();

                throw new Error(
                    errorText
                );

            }


            if (editingId.value) {

                showMessage(
                    "Timetable entry updated successfully!",
                    "green"
                );

            }

            else {

                showMessage(
                    "Timetable entry added successfully!",
                    "green"
                );

            }


            resetForm();

            await loadTimetable();

        }

        catch (error) {

            console.error(error);

            showMessage(
                "Could not save timetable entry.",
                "red"
            );

        }

    }
);


/* ========================= */
/* EDIT TIMETABLE */
/* ========================= */

function editTimetable(id) {

    const item =
        timetableData.find(
            entry =>
                Number(entry.id) === Number(id)
        );


    if (!item) {

        return;

    }


    document.getElementById("day").value =
        item.day;

    document.getElementById("subject").value =
        item.subject;

    document.getElementById("teacher").value =
        item.teacher;

    document.getElementById("room").value =
        item.room;

    document.getElementById("startTime").value =
        item.start_time.substring(0, 5);

    document.getElementById("endTime").value =
        item.end_time.substring(0, 5);


    classTypeInput.value =
        item.class_type || "Theory";


    updateTypeButtons();


    editingId.value =
        item.id;


    formTitle.textContent =
        "Edit Class";

    editingStatus.textContent =
        "Editing Entry";

    submitBtn.innerHTML =
        "<span>✓</span> Update Class";

    cancelEditBtn.classList.remove(
        "hidden"
    );


    updateSubjectCounter();


    document
        .getElementById("managePage")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* ========================= */
/* CANCEL EDIT */
/* ========================= */

cancelEditBtn.addEventListener(
    "click",
    resetForm
);


function resetForm() {

    form.reset();


    editingId.value = "";


    classTypeInput.value =
        "Theory";


    updateTypeButtons();


    formTitle.textContent =
        "Add New Class";

    editingStatus.textContent =
        "New Entry";

    submitBtn.innerHTML =
        "<span>＋</span> Add Class";

    cancelEditBtn.classList.add(
        "hidden"
    );


    updateSubjectCounter();

}


/* ========================= */
/* DELETE */
/* ========================= */

async function deleteTimetable(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this timetable entry?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/timetable?id=eq.${id}`,
                {

                    method: "DELETE",

                    headers: {

                        "apikey":
                            SUPABASE_KEY,

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


        showMessage(
            "Timetable entry deleted.",
            "green"
        );


        await loadTimetable();

    }

    catch (error) {

        console.error(error);

        showMessage(
            "Could not delete timetable entry.",
            "red"
        );

    }

}


/* ========================= */
/* FILTER */
/* ========================= */

filterDay.addEventListener(
    "change",
    displayTimetable
);


/* ========================= */
/* CLASS TYPE BUTTONS */
/* ========================= */

const typeButtons =
    document.querySelectorAll(
        ".type-btn"
    );


typeButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            classTypeInput.value =
                this.dataset.type;

            updateTypeButtons();

        }
    );

});


function updateTypeButtons() {

    typeButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.type ===
            classTypeInput.value
        );

    });

}


/* ========================= */
/* SUBJECT WORD COUNTER */
/* ========================= */

subjectInput.addEventListener(
    "input",
    updateSubjectCounter
);


function updateSubjectCounter() {

    const count =
        countWords(
            subjectInput.value
        );


    subjectCounter.textContent =
        `${count} / 9 words`;


    if (count > 9) {

        subjectCounter.style.color =
            "#dc2626";

    }

    else {

        subjectCounter.style.color =
            "#64748b";

    }

}


function countWords(text) {

    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;

}


/* ========================= */
/* STATISTICS */
/* ========================= */

function updateStatistics() {

    document.getElementById(
        "totalClasses"
    ).textContent =
        timetableData.length;


    const labs =
        timetableData.filter(
            item =>
                (item.class_type || "Theory")
                === "Lab"
        ).length;


    const theory =
        timetableData.length -
        labs;


    document.getElementById(
        "labClasses"
    ).textContent =
        labs;


    document.getElementById(
        "theoryClasses"
    ).textContent =
        theory;


    const teachers =
        new Set(
            timetableData.map(
                item =>
                    item.teacher
                        .trim()
                        .toLowerCase()
            )
        );


    document.getElementById(
        "teacherCount"
    ).textContent =
        teachers.size;

}


/* ========================= */
/* WEEKLY TIMETABLE */
/* ========================= */

function displayWeeklyTimetable() {

    weeklyBody.innerHTML = "";


    const timeSlots =
        createTimeSlots();


    timeSlots.forEach(slot => {

        const row =
            document.createElement("tr");


        let html = `
            <td>
                ${formatTime(slot.start)}
                -
                ${formatTime(slot.end)}
            </td>
        `;


        days.forEach(day => {

            const classes =
                timetableData.filter(item => {

                    return (
                        item.day === day &&
                        timesOverlap(
                            item.start_time,
                            item.end_time,
                            slot.start,
                            slot.end
                        )
                    );

                });


            if (classes.length === 0) {

                html += `
                    <td>
                        <span style="color:#cbd5e1;">
                            —
                        </span>
                    </td>
                `;

            }

            else {

                html += "<td>";


                classes.forEach(item => {

                    const type =
                        item.class_type ||
                        "Theory";


                    html += `

                        <div class="class-box ${
                            type === "Lab"
                                ? "lab"
                                : ""
                        }">

                            <div class="class-subject">
                                ${escapeHTML(
                                    item.subject
                                )}
                            </div>

                            <div class="class-teacher">
                                👨‍🏫
                                ${formatTeacherForTimetable(
                                    item.teacher
                                )}
                            </div>

                            <div class="class-room">
                                📍
                                ${escapeHTML(
                                    item.room
                                )}
                            </div>

                            <div class="class-type">
                                ${
                                    type === "Lab"
                                        ? "🧪 Lab"
                                        : "🎓 Theory"
                                }
                            </div>

                        </div>

                    `;

                });


                html += "</td>";

            }

        });


        row.innerHTML = html;

        weeklyBody.appendChild(row);

    });

}


/* ========================= */
/* TIME SLOTS */
/* ========================= */

function createTimeSlots() {

    const slots = [];

    const times = new Set();


    timetableData.forEach(item => {

        times.add(
            item.start_time.substring(0, 5)
        );

        times.add(
            item.end_time.substring(0, 5)
        );

    });


    const sorted =
        Array.from(times).sort();


    for (
        let i = 0;
        i < sorted.length - 1;
        i++
    ) {

        slots.push({

            start: sorted[i],

            end: sorted[i + 1]

        });

    }


    if (slots.length === 0) {

        slots.push({
            start: "09:00",
            end: "10:00"
        });

    }


    return slots;

}


/* ========================= */
/* TIME OVERLAP */
/* ========================= */

function timesOverlap(
    startA,
    endA,
    startB,
    endB
) {

    return (
        startA.substring(0, 5) < endB &&
        endA.substring(0, 5) > startB
    );

}


/* ========================= */
/* TEACHER DIRECTORY */
/* ========================= */

function displayTeacherDirectory() {

    teacherGrid.innerHTML = "";


    const teacherMap =
        new Map();


    timetableData.forEach(item => {

        const teacher =
            item.teacher.trim();


        const key =
            teacher.toLowerCase();


        if (!teacherMap.has(key)) {

            teacherMap.set(
                key,
                {
                    name: teacher,
                    subjects: new Set()
                }
            );

        }


        teacherMap
            .get(key)
            .subjects
            .add(item.subject);

    });


    if (teacherMap.size === 0) {

        teacherGrid.innerHTML = `
            <p style="color:#64748b;">
                No teacher information available yet.
            </p>
        `;

        return;

    }


    teacherMap.forEach(teacher => {

        const div =
            document.createElement("div");


        div.className =
            "teacher-item";


        const subjects =
            Array.from(
                teacher.subjects
            ).join(", ");


        div.innerHTML = `

            <div class="teacher-name">
                👨‍🏫
                ${escapeHTML(
                    teacher.name
                )}
            </div>

            <div class="teacher-subject">

                <strong>
                    Subjects:
                </strong>

                ${escapeHTML(
                    subjects
                )}

            </div>

        `;


        teacherGrid.appendChild(div);

    });

}


/* ========================= */
/* TEACHER DISPLAY LOGIC */
/* ========================= */

/*
    One name:
        Rahul
        -> Rahul

    Two or more names:
        Rahul Kumar
        -> R.K.

        Rahul Kumar Sharma
        -> R.K.S.

    Full names are always displayed
    in the teacher directory below.
*/

function formatTeacherForTimetable(
    fullName
) {

    const words =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length <= 1) {

        return escapeHTML(
            fullName
        );

    }


    return words
        .map(
            word =>
                escapeHTML(
                    word.charAt(0)
                        .toUpperCase()
                ) + "."
        )
        .join("");

}


/* ========================= */
/* TIME FORMAT */
/* ========================= */

function formatTime(time) {

    if (!time) {

        return "";

    }


    const parts =
        time.substring(0, 5)
            .split(":");


    let hour =
        Number(parts[0]);

    const minute =
        parts[1];


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${suffix}`;

}


/* ========================= */
/* MESSAGE */
/* ========================= */

function showMessage(
    text,
    color
) {

    message.textContent =
        text;

    message.style.color =
        color;


    setTimeout(() => {

        message.textContent =
            "";

    }, 4000);

}


/* ========================= */
/* HTML SAFETY */
/* ========================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ========================= */
/* PAGE SWITCHING */
/* ========================= */

const managePage =
    document.getElementById(
        "managePage"
    );

const viewPage =
    document.getElementById(
        "viewPage"
    );

const managePageBtn =
    document.getElementById(
        "managePageBtn"
    );

const viewPageBtn =
    document.getElementById(
        "viewPageBtn"
    );


managePageBtn.addEventListener(
    "click",
    () => {

        managePage.classList.remove(
            "hidden"
        );

        viewPage.classList.add(
            "hidden"
        );

        managePageBtn.classList.add(
            "active"
        );

        viewPageBtn.classList.remove(
            "active"
        );

    }
);


viewPageBtn.addEventListener(
    "click",
    () => {

        managePage.classList.add(
            "hidden"
        );

        viewPage.classList.remove(
            "hidden"
        );

        viewPageBtn.classList.add(
            "active"
        );

        managePageBtn.classList.remove(
            "active"
        );


        displayWeeklyTimetable();

        displayTeacherDirectory();

    }
);


/* ========================= */
/* REFRESH VIEW */
/* ========================= */

document
    .getElementById("refreshViewBtn")
    .addEventListener(
        "click",
        loadTimetable
    );