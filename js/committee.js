// صفحة لجنة إدارة الدار
// تم اضافة صلاحيات الادمن
let allMembers = [];
let currentCommittee = {
  housePresident: null,
  president: null,
  vicePresident: null,
  secretaryGeneral: null,
  assistantSecretary: null,
  treasurer: null,
  assistantTreasurer: null,
  members: [],
};
let selectedMembers = new Set();

// تهيئة الصفحة
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 بدء تهيئة صفحة لجنة الإدارة...");

  // تهيئة Supabase (إن وُجد)
  if (typeof supabaseInit === "function") supabaseInit();
  else
    console.warn(
      "Supabase init not found; committee page may not function properly.",
    );

  // جلب الأعضاء وتعبئة القوائم
  loadMembers();

  // إعداد الأحداث
  setupEventListeners();

  // تحميل التشكيل السابق
  loadSavedCommittee();

  console.log("✅ تم تهيئة الصفحة بنجاح");
});

// جلب الأعضاء من قاعدة البيانات
async function loadMembers() {
  try {
    showMessage("جاري تحميل قائمة الأعضاء...", "info");

    if (typeof window.supabaseDB === "undefined") {
      throw new Error("Supabase client not initialized");
    }

    // استخدام الواجهة لتجميع الأعضاء والاشتراكات
    const normalized = await window.supabaseDB.getAllMembersWithSubscriptions();
    allMembers = (normalized || []).map((item) => {
      return {
        id: item.id,
        name: item.name || "غير محدد",
        phone: item.phone || "غير محدد",
        joinYear: item.join_year || item.joinYear || new Date().getFullYear(),
        status: item.status || "active",
        subscriptions: item.subscriptions || [],
      };
    });

    console.log(`✅ تم جلب ${allMembers.length} عضو`);

    // تعبئة القوائم المنسدلة
    populateMemberSelects();

    showMessage("تم تحميل قائمة الأعضاء بنجاح", "success");
  } catch (error) {
    console.error("❌ خطأ في جلب الأعضاء:", error);
    showMessage(`❌ حدث خطأ أثناء جلب الأعضاء: ${error.message}`, "error");
  }
}

// تعبئة القوائم المنسدلة بالأعضاء
function populateMemberSelects() {
  if (allMembers.length === 0) return;

  // فرز الأعضاء حسب الاسم
  const sortedMembers = [...allMembers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // الحصول على جميع عناصر الـ select
  const selectElements = [
    "presidentSelect",
    "vicePresidentSelect",
    "secretaryGeneralSelect",
    "assistantSecretarySelect",
    "treasurerSelect",
    "assistantTreasurerSelect",
    "committeeMemberSelect",
    "housePresidentSelect",
    "assistantHousePresidentSelect",
  ];

  // تعبئة كل قائمة منسدلة
  selectElements.forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (!select) return;

    // حفظ الخيار المختار الحالي
    const currentValue = select.value;

    // مسح الخيارات الحالية (باستثناء الخيار الأول)
    select.innerHTML =
      '<option value="">' + select.options[0].text + "</option>";

    // إضافة الأعضاء
    sortedMembers.forEach((member) => {
      const option = document.createElement("option");
      option.value = member.id;
      option.textContent = `${member.name} - ${member.phone}`;
      option.setAttribute("data-member", JSON.stringify(member));
      select.appendChild(option);
    });

    // استعادة القيمة المختارة إذا كانت موجودة
    if (currentValue) {
      select.value = currentValue;
      updateMemberInfo(selectId, currentValue);
    }
  });

  // تحديث العدد
  updateMembersCount();
}

// إعداد الأحداث
function setupEventListeners() {
  // أحداث التحديد للرئاسة والأمانة العامة وأمانة المال
  const positionSelects = [
    "presidentSelect",
    "vicePresidentSelect",
    "secretaryGeneralSelect",
    "assistantSecretarySelect",
    "treasurerSelect",
    "assistantTreasurerSelect",
    "housePresidentSelect",
    "assistantHousePresidentSelect",
  ];

  positionSelects.forEach((selectId) => {
    document.getElementById(selectId).addEventListener("change", function () {
      const memberId = this.value;
      updateMemberInfo(selectId, memberId);
      updateCurrentCommittee();
      autoSaveCommittee();
    });
  });

  // حدث إضافة عضو للجنة
  document
    .getElementById("addMemberBtn")
    .addEventListener("click", addCommitteeMember);

  // أحداث الأزرار
  document
    .getElementById("saveCommitteeBtn")
    .addEventListener("click", saveCommittee);
  document
    .getElementById("resetCommitteeBtn")
    .addEventListener("click", resetCommittee);
  document
    .getElementById("clearAllBtn")
    .addEventListener("click", clearAllSelections);
  document
    .getElementById("printCommitteeBtn")
    .addEventListener("click", printCommittee);

  // السماح بالإدخال بواسطة Enter
  document
    .getElementById("committeeMemberSelect")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addCommitteeMember();
      }
    });
}

// إضافة عضو إلى قائمة أعضاء اللجنة
function addCommitteeMember() {
  const select = document.getElementById("committeeMemberSelect");
  const memberId = select.value;

  if (!memberId) {
    showMessage("يرجى اختيار عضو من القائمة", "warning");
    return;
  }

  const member = allMembers.find((m) => m.id === memberId);
  if (!member) {
    showMessage("العضو المختار غير موجود", "error");
    return;
  }

  // التحقق من عدم تكرار العضو
  if (selectedMembers.has(memberId)) {
    showMessage("هذا العضو موجود بالفعل في اللجنة", "warning");
    return;
  }

  // التحقق من عدم تجاوز الحد الأقصى
  if (currentCommittee.members.length >= 10) {
    showMessage("تم الوصول إلى الحد الأقصى للأعضاء (10 أعضاء)", "error");
    return;
  }

  // إضافة العضو
  selectedMembers.add(memberId);
  currentCommittee.members.push({
    id: member.id,
    name: member.name,
    phone: member.phone,
    joinYear: member.joinYear,
    status: member.status,
  });

  // تحديث العرض
  updateMembersList();
  updateMembersCount();
  updateCurrentCommittee();
  autoSaveCommittee();

  // إعادة تعيين القائمة المنسدلة
  select.value = "";
  select.focus();

  showMessage(`تم إضافة ${member.name} إلى أعضاء اللجنة`, "success");
}

// تحديث قائمة أعضاء اللجنة
function updateMembersList() {
  const membersList = document.getElementById("committeeMembersList");
  membersList.innerHTML = "";

  if (currentCommittee.members.length === 0) {
    membersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>لم يتم إضافة أي أعضاء بعد</p>
            </div>
        `;
    return;
  }

  currentCommittee.members.forEach((member, index) => {
    const memberCard = document.createElement("div");
    memberCard.className = "member-card";
    memberCard.innerHTML = `
            <div class="member-card-content">
                <div class="member-name">${member.name}</div>
                <div class="member-phone">${member.phone}</div>
                <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                    سنة الانضمام: ${member.joinYear} | الحالة: ${getStatusText(
                      member.status,
                    )}
                </div>
            </div>
            <button type="button" class="remove-member-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
    membersList.appendChild(memberCard);
  });

  // إضافة أحداث لأزرار الحذف
  document.querySelectorAll(".remove-member-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      removeCommitteeMember(index);
    });
  });
}

// إزالة عضو من قائمة أعضاء اللجنة
function removeCommitteeMember(index) {
  if (index >= 0 && index < currentCommittee.members.length) {
    const member = currentCommittee.members[index];
    selectedMembers.delete(member.id);
    currentCommittee.members.splice(index, 1);

    updateMembersList();
    updateMembersCount();
    updateCurrentCommittee();
    autoSaveCommittee();

    showMessage(`تم إزالة ${member.name} من أعضاء اللجنة`, "info");
  }
}

// تحديث عدد الأعضاء
function updateMembersCount() {
  document.getElementById("membersCount").textContent =
    currentCommittee.members.length;
}

// تحديث معلومات العضو المختار
function updateMemberInfo(selectId, memberId) {
  const infoDiv = document.getElementById(selectId.replace("Select", "Info"));
  if (!infoDiv) return;

  if (!memberId) {
    infoDiv.classList.remove("show");
    updateCurrentCommitteePosition(selectId, null);
    return;
  }

  const member = allMembers.find((m) => m.id === memberId);
  if (!member) return;

  // حساب إجمالي المدفوع والمتأخر
  const totalPaid = calculateTotalPaid(member);
  const totalDue = calculateTotalDue(member);
  const remaining = Math.max(0, totalDue - totalPaid);
  const status = getStatusText(member.status);

  infoDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #2c5aa0;">${member.name}</strong>
            <span style="background-color: ${getStatusColor(
              member.status,
            )}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px;">
                ${status}
            </span>
        </div>
        <div class="member-details">
            <div class="detail-item">
                <span class="detail-label">الجوال:</span>
                <span class="detail-value">${member.phone}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">سنة الانضمام:</span>
                <span class="detail-value">${member.joinYear}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المدفوع:</span>
                <span class="detail-value">${formatCurrency(totalPaid)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المتأخر:</span>
                <span class="detail-value">${formatCurrency(remaining)}</span>
            </div>
        </div>
    `;
  infoDiv.classList.add("show");

  // تحديث المنصب في currentCommittee
  updateCurrentCommitteePosition(selectId, {
    id: member.id,
    name: member.name,
    phone: member.phone,
    joinYear: member.joinYear,
    status: member.status,
    totalPaid: totalPaid,
    totalDue: totalDue,
    remaining: remaining,
  });
}

// تحديث المنصب في currentCommittee
function updateCurrentCommitteePosition(selectId, memberData) {
  switch (selectId) {
    case "presidentSelect":
      currentCommittee.president = memberData;
      break;
    case "vicePresidentSelect":
      currentCommittee.vicePresident = memberData;
      break;
    case "secretaryGeneralSelect":
      currentCommittee.secretaryGeneral = memberData;
      break;
    case "assistantSecretarySelect":
      currentCommittee.assistantSecretary = memberData;
      break;
    case "treasurerSelect":
      currentCommittee.treasurer = memberData;
      break;
    case "assistantTreasurerSelect":
      currentCommittee.assistantTreasurer = memberData;
      break;
    case "housePresidentSelect": // إضافة جديدة
      currentCommittee.housePresident = memberData;
      break;
    case "assistantHousePresidentSelect": // إضافة جديدة
      currentCommittee.assistantHousePresident = memberData;
      break;
  }
}

// تحديث جدول اللجنة الحالية
function updateCurrentCommittee() {
  const tableBody = document.getElementById("currentCommitteeTableBody");
  tableBody.innerHTML = "";

  const positions = [
    { key: "president", title: "رئيس اللجنة", badgeClass: "badge-president" },
    { key: "vicePresident", title: "نائب الرئيس", badgeClass: "badge-vice" },
    {
      key: "secretaryGeneral",
      title: "الأمين العام",
      badgeClass: "badge-secretary",
    },
    {
      key: "assistantSecretary",
      title: "مساعد الأمين العام",
      badgeClass: "badge-secretary",
    },
    { key: "treasurer", title: "أمين المال", badgeClass: "badge-treasurer" },
    {
      key: "assistantTreasurer",
      title: "مساعد أمين المال",
      badgeClass: "badge-treasurer",
    },
    {
      key: "housePresident",
      title: "رئيس الدار",
      badgeClass: "badge-house-president",
    },
    {
      key: "assistantHousePresident",
      title: "مساعد رئيس الدار",
      badgeClass: "badge-house-president",
    }, // إضافة جديدة
  ];

  let hasData = false;

  // عرض المناصب الرئيسية
  positions.forEach((position) => {
    const member = currentCommittee[position.key];
    if (member) {
      hasData = true;
      addMemberToTable(
        tableBody,
        member,
        position.title,
        position.badgeClass,
        null,
        position.key,
      );
    }
  });

  // عرض أعضاء اللجنة
  currentCommittee.members.forEach((member, index) => {
    hasData = true;
    addMemberToTable(tableBody, member, "عضو اللجنة", "badge-member", index);
  });

  if (!hasData) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #6c757d; padding: 20px;">
                    <i class="fas fa-info-circle"></i> لم يتم تشكيل اللجنة بعد
                </td>
            </tr>
        `;
  }
}

// إضافة عضو إلى جدول اللجنة
function addMemberToTable(
  tableBody,
  member,
  position,
  badgeClass,
  memberIndex = null,
  positionKey = null,
) {
  const row = document.createElement("tr");
  row.innerHTML = `
        <td>
            <span class="position-badge ${badgeClass}">${position}</span>
        </td>
        <td>
            <strong>${member.name}</strong>
            ${
              memberIndex !== null
                ? `<br><small style="color: #6c757d;">ترتيب ${
                    memberIndex + 1
                  }</small>`
                : ""
            }
        </td>
        <td>${member.phone}</td>
        <td>
            <span style="background-color: ${getStatusColor(
              member.status,
            )}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 12px;">
                ${getStatusText(member.status)}
            </span>
        </td>

        <td>
            <button type="button" class="btn-danger btn-sm remove-item-btn" 
                title="${
                  memberIndex !== null ? "حذف من اللجنة" : "إزالة من المنصب"
                }">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
  tableBody.appendChild(row);

  // إضافة حدث الحذف
  row.querySelector(".remove-item-btn").addEventListener("click", function () {
    if (memberIndex !== null) {
      removeCommitteeMember(memberIndex);
    } else if (positionKey) {
      removePersonFromPosition(positionKey, position);
    }
  });
}

// إزالة شخص من منصب محدد
function removePersonFromPosition(key, title) {
  if (confirm(`هل تريد إزالة العضو من منصب ${title}؟`)) {
    // إفراغ المنصب في الكائن البرمجي
    currentCommittee[key] = null;

    // تحديث القائمة المنسدلة المقابلة في الواجهة
    const selectId = key + "Select";
    const select = document.getElementById(selectId);
    if (select) {
      select.value = "";
    }

    // إخفاء قسم المعلومات المقابل
    const infoDivId = key + "Info";
    const infoDiv = document.getElementById(infoDivId);
    if (infoDiv) {
      infoDiv.classList.remove("show");
    }

    // تحديث العرض والحفظ
    updateCurrentCommittee();
    autoSaveCommittee();

    showMessage(`تم إزالة العضو من منصب ${title}`, "info");
  }
}

// الحفظ التلقائي
function autoSaveCommittee() {
  // حفظ في localStorage
  try {
    localStorage.setItem(
      "committee_auto_save",
      JSON.stringify({
        committee: currentCommittee,
        selectedMembers: Array.from(selectedMembers),
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn("لا يمكن حفظ التشكيل تلقائياً:", error);
  }
}

// حفظ التشكيل
async function saveCommittee() {
  try {
    showMessage("جاري حفظ تشكيل اللجنة...", "info");

    // التحقق من وجود رئيس
    if (!currentCommittee.president) {
      showMessage("يرجى اختيار رئيس للجنة", "warning");
      return;
    }

    // حفظ في localStorage
    localStorage.setItem(
      "committee_saved",
      JSON.stringify({
        committee: currentCommittee,
        selectedMembers: Array.from(selectedMembers),
        savedAt: new Date().toISOString(),
        savedBy: "user",
      }),
    );

    // تحديث معلومات آخر تحديث
    updateLastUpdateInfo();

    showMessage("تم حفظ تشكيل اللجنة بنجاح", "success");

    // إذا كان Supabase متاحاً، يمكن حفظه في قاعدة البيانات
    if (typeof window.supabaseDB !== "undefined") {
      await saveCommitteeToDatabase();
    }
  } catch (error) {
    console.error("❌ خطأ في حفظ التشكيل:", error);
    showMessage(`❌ حدث خطأ أثناء الحفظ: ${error.message}`, "error");
  }
}

// حفظ في قاعدة البيانات (Supabase)
async function saveCommitteeToDatabase() {
  try {
    // هنا يمكنك إضافة كود لحفظ التشكيل في قاعدة البيانات
    // مثلاً في جدول committee_members
    console.log("💾 حفظ تشكيل اللجنة في قاعدة البيانات...");

    // محاكاة عملية الحفظ
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✅ تم الحفظ في قاعدة البيانات");
  } catch (error) {
    console.error("❌ خطأ في حفظ قاعدة البيانات:", error);
    throw error;
  }
}

// تحميل التشكيل المحفوظ
function loadSavedCommittee() {
  try {
    const saved = localStorage.getItem("committee_saved");
    const autoSaved = localStorage.getItem("committee_auto_save");

    // الأفضلية للتشكيل المحفوظ يدوياً
    const data = saved
      ? JSON.parse(saved)
      : autoSaved
        ? JSON.parse(autoSaved)
        : null;

    if (data && data.committee) {
      // استعادة البيانات
      currentCommittee = data.committee;
      selectedMembers = new Set(data.selectedMembers || []);

      // تحديث القوائم المنسدلة
      updateSelectValues();

      // تحديث العرض
      updateMembersList();
      updateMembersCount();
      updateCurrentCommittee();
      updateLastUpdateInfo();

      showMessage("تم تحميل التشكيل السابق", "success");
    }
  } catch (error) {
    console.warn("❌ خطأ في تحميل التشكيل المحفوظ:", error);
  }
}

// تحديث قيم القوائم المنسدلة
function updateSelectValues() {
  const selectMappings = [
    { key: "president", selectId: "presidentSelect" },
    { key: "vicePresident", selectId: "vicePresidentSelect" },
    { key: "secretaryGeneral", selectId: "secretaryGeneralSelect" },
    { key: "assistantSecretary", selectId: "assistantSecretarySelect" },
    { key: "treasurer", selectId: "treasurerSelect" },
    { key: "assistantTreasurer", selectId: "assistantTreasurerSelect" },
    { key: "housePresident", selectId: "housePresidentSelect" }, // إضافة جديدة
    {
      key: "assistantHousePresident",
      selectId: "assistantHousePresidentSelect",
    }, // إضافة جديدة
  ];

  selectMappings.forEach((mapping) => {
    const member = currentCommittee[mapping.key];
    const select = document.getElementById(mapping.selectId);
    if (select && member) {
      select.value = member.id;
      updateMemberInfo(mapping.selectId, member.id);
    }
  });
}

// استعادة التشكيل السابق
function resetCommittee() {
  if (
    confirm(
      "هل تريد استعادة التشكيل السابق المحفوظ؟ سيتم فقدان التغييرات غير المحفوظة.",
    )
  ) {
    loadSavedCommittee();
  }
}

// مسح الكل
function clearAllSelections() {
  if (
    confirm("هل تريد مسح جميع الاختيارات؟ سيتم إزالة جميع الأعضاء من اللجنة.")
  ) {
    // إعادة تعيين currentCommittee
    currentCommittee = {
      president: null,
      vicePresident: null,
      secretaryGeneral: null,
      assistantSecretary: null,
      treasurer: null,
      assistantTreasurer: null,
      housePresident: null, // إضافة جديدة
      members: [],
    };
    selectedMembers.clear();

    // إعادة تعيين القوائم المنسدلة
    const selectIds = [
      "presidentSelect",
      "vicePresidentSelect",
      "secretaryGeneralSelect",
      "assistantSecretarySelect",
      "treasurerSelect",
      "assistantTreasurerSelect",
      "committeeMemberSelect",
      "housePresidentSelect", // إضافة جديدة
      "assistantHousePresidentSelect", // إضافة جديدة
    ];

    selectIds.forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (select) select.value = "";

      const infoDiv = document.getElementById(
        selectId.replace("Select", "Info"),
      );
      if (infoDiv) infoDiv.classList.remove("show");
    });

    // تحديث العرض
    updateMembersList();
    updateMembersCount();
    updateCurrentCommittee();

    showMessage("تم مسح جميع الاختيارات", "info");
  }
}

// تحديث معلومات آخر تحديث
function updateLastUpdateInfo() {
  const lastUpdateInfo = document.getElementById("lastUpdateInfo");
  const saved = localStorage.getItem("committee_saved");

  if (saved) {
    try {
      const data = JSON.parse(saved);
      const date = new Date(data.savedAt);
      lastUpdateInfo.innerHTML = `
                <p><strong>آخر تحديث:</strong> ${date.toLocaleString(
                  "ar-SA",
                )}</p>
                <p><strong>عدد الأعضاء:</strong> ${
                  data.committee.members.length + 6
                }</p>
                <p><strong>حالة الحفظ:</strong> <span style="color: #28a745;">محفوظ</span></p>
            `;
    } catch (error) {
      lastUpdateInfo.innerHTML = `<p>خطأ في قراءة بيانات آخر تحديث</p>`;
    }
  } else {
    lastUpdateInfo.innerHTML = `<p>لم يتم حفظ أي تشكيل سابق</p>`;
  }
}

// طباعة التشكيل
function printCommittee() {
  const printContent = generatePrintContent();
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = `
        <div style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 20px;">
            <h1 style="text-align: center; color: #2c5aa0;">تشكيل لجنة إدارة دار أبناء سلنارتي</h1>
            <p style="text-align: center;">تاريخ الطباعة: ${new Date().toLocaleString(
              "ar-SA",
            )}</p>
            <hr>
            ${printContent}
        </div>
    `;

  window.print();
  document.body.innerHTML = originalContent;
  location.reload();
}

// تحميل مكتبة html2pdf
function loadHTML2PDFLibrary() {
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
  script.onload = function () {
    exportCommitteeAsPDF();
  };
  document.head.appendChild(script);
}

// توليد محتوى للطباعة
function generatePrintContent() {
  let content = `
        <div style="margin-bottom: 15px;">
            <h2 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">الرئاسة</h2>
            ${generatePositionHTML("رئيس اللجنة", currentCommittee.president)}
            ${generatePositionHTML(
              "نائب الرئيس",
              currentCommittee.vicePresident,
            )}
        </div>
        
        <div style="margin-bottom: 15px;">
            <h2 style="color: #28a745; border-bottom: 2px solid #28a745; padding-bottom: 10px;">الأمانة العامة</h2>
            ${generatePositionHTML(
              "الأمين العام",
              currentCommittee.secretaryGeneral,
            )}
            ${generatePositionHTML(
              "مساعد الأمين العام",
              currentCommittee.assistantSecretary,
            )}
        </div>
        
        <div style="margin-bottom: 15px;">
            <h2 style="color: #17a2b8; border-bottom: 2px solid #17a2b8; padding-bottom: 10px;">أمانة المال</h2>
            ${generatePositionHTML("أمين المال", currentCommittee.treasurer)}
            ${generatePositionHTML(
              "مساعد أمين المال",
              currentCommittee.assistantTreasurer,
            )}
            </div>
             <div style="margin-bottom: 15px;">
            <h2 style="color: #f007bdff; border-bottom: 2px solid #f007bdff; padding-bottom: 10px;">شئون الدار</h2>
            
            ${generatePositionHTML(
              "رئيس الدار",
              currentCommittee.housePresident,
            )} 
            ${generatePositionHTML(
              "مساعد رئيس الدار",
              currentCommittee.assistantHousePresident,
            )} <!-- إضافة جديدة -->
        </div>
    `;

  if (currentCommittee.members.length > 0) {
    content += `
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h2 style="color: #6f42c1; border-bottom: 2px solid #6f42c1; padding-bottom: 10px; margin-bottom: 20px;">أعضاء اللجنة</h2>
            <div style="overflow-x: auto;">
                <table style="
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                    min-width: 600px;
                    table-layout: fixed;
                ">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="
                                padding: 12px 8px;
                                text-align: center;
                                border: 1px solid #ddd;
                                background-color: #6f42c1;
                                color: white;
                                font-weight: bold;
                                width: 8%;
                                min-width: 50px;
                            ">م</th>
                            <th style="
                                padding: 12px 8px;
                                text-align: center;
                                border: 1px solid #ddd;
                                background-color: #6f42c1;
                                color: white;
                                font-weight: bold;
                                width: 47%;
                                min-width: 200px;
                            ">اسم العضو</th>
                            <th style="
                                padding: 12px 8px;
                                text-align: center;
                                border: 1px solid #ddd;
                                background-color: #6f42c1;
                                color: white;
                                font-weight: bold;
                                width: 45%;
                                min-width: 150px;
                            ">رقم الجوال</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentCommittee.members
                          .map(
                            (member, index) => `
                                <tr style="${
                                  index % 2 === 0
                                    ? "background-color: #f8f9fa;"
                                    : "background-color: white;"
                                }">
                                    <td style="
                                        padding: 10px 8px;
                                        text-align: center;
                                        border: 1px solid #ddd;
                                        font-weight: bold;
                                        color: #6f42c1;
                                    ">${index + 1}</td>
                                    <td style="
                                        padding: 10px 8px;
                                        text-align: right;
                                        border: 1px solid #ddd;
                                        font-size: 15px;
                                        font-weight: 600;
                                        color: #2c5aa0;
                                    ">${member.name}</td>
                                    <td style="
                                        padding: 10px 8px;
                                        text-align: center;
                                        border: 1px solid #ddd;
                                        font-family: monospace;
                                        font-size: 13px;
                                        direction: ltr;
                                    ">${member.phone}</td>
                                </tr>
                            `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 15px; text-align: center; color: #6c757d; font-size: 12px;">
                <p>إجمالي عدد الأعضاء: <strong>${
                  currentCommittee.members.length
                }</strong> عضو</p>
            </div>
        </div>
    `;
  }

  content += `
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
            <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة دار أبناء سلنارتي بالرياض</p>
            <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
    `;

  return content;
}

// توليد HTML للمنصب
function generatePositionHTML(title, member) {
  if (!member) return `<p style="color: #6c757d;">${title}: غير محدد</p>`;

  return `
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
            <h3 style="margin: 0 0 10px 0;">${title}</h3>
            <p style="margin: 5px 0;"><strong>الاسم:</strong> ${member.name}</p>
            <p style="margin: 5px 0;"><strong>رقم الجوال:</strong> ${member.phone}</p>

        </div>
    `;
}

// دالات مساعدة
function calculateTotalPaid(member) {
  if (!member.subscriptions) return 0;
  return member.subscriptions.reduce(
    (sum, sub) => sum + (sub.amount_paid || sub.paid || 0),
    0,
  );
}

function calculateTotalDue(member) {
  if (!member.subscriptions) return 0;
  return member.subscriptions.reduce(
    (sum, sub) => sum + (sub.amount_due || sub.amount || 0),
    0,
  );
}

function getStatusText(status) {
  const statusMap = {
    paid: "مسدد",
    partial: "مسدد جزئياً",
    unpaid: "غير مسدد",
    settled: "تمت التسوية",
    active: "نشط",
    inactive: "غير نشط",
  };
  return statusMap[status] || status;
}

function getStatusColor(status) {
  const colorMap = {
    paid: "#28a745",
    partial: "#ffc107",
    unpaid: "#dc3545",
    settled: "#6f42c1",
    active: "#17a2b8",
    inactive: "#6c757d",
  };
  return colorMap[status] || "#6c757d";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("SAR", "ريال");
}

function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.innerHTML = text;
  messageDiv.className = `message ${type} show`;

  setTimeout(() => {
    messageDiv.classList.remove("show");
  }, 5000);
}

// تحديث معلومات آخر تحديث عند التحميل
updateLastUpdateInfo();
