document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalExpensesEl = document.getElementById("totalExpenses");
  const netBalanceEl = document.getElementById("netBalance");
  const expenseForm = document.getElementById("expenseForm");
  const expensesTableBody = document.getElementById("expensesTableBody");
  const tableLoading = document.getElementById("tableLoading");

  // Initial Data Load
  try {
    if (typeof window.supabaseInit === "function") {
      await window.supabaseInit();
    }
    await loadAccountsData();
  } catch (error) {
    console.error("خطأ في تهيئة قاعدة البيانات:", error);
  }

  // Handle Form Submit
  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("expenseType").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const date = document.getElementById("expenseDate").value;
    const notes = document.getElementById("expenseNotes").value;

    if (!type || !amount || !date) {
      alert("الرجاء تعبئة جميع الحقول المطلوبة.");
      return;
    }

    try {
      const btn = document.getElementById("saveExpenseBtn");
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

      await window.supabaseDB.addExpense({
        expense_type: type,
        amount: amount,
        expense_date: date,
        notes: notes
      });

      alert("تم إضافة المصروف بنجاح!");
      expenseForm.reset();
      await loadAccountsData();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ المصروف. يرجى التأكد من اتصال الإنترنت أو من إعدادات وصلاحيات قاعدة بيانات Supabase لجدول Expenses");
    } finally {
      const btn = document.getElementById("saveExpenseBtn");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> حفظ المصروف';
    }
  });

  async function loadAccountsData() {
    tableLoading.style.display = 'flex';
    expensesTableBody.innerHTML = '';

    try {
      // 1. Fetch Revenue
      const members = await window.supabaseDB.getAllMembersWithSubscriptions();
      let totalRevenue = 0;
      members.forEach((member) => {
        if (member.subscriptions && Array.isArray(member.subscriptions)) {
          member.subscriptions.forEach((sub) => {
            if (sub.subscription_type !== "none") {
              const paid = parseFloat(sub.amount_paid) || 0;
              totalRevenue += paid;
            }
          });
        }
      });

      // 2. Fetch Expenses
      const expenses = await window.supabaseDB.getAllExpenses();
      const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

      // 3. Update UI Cards
      totalRevenueEl.innerText = `${totalRevenue.toLocaleString()} ريال`;
      totalExpensesEl.innerText = `${totalExpenses.toLocaleString()} ريال`;
      
      const net = totalRevenue - totalExpenses;
      netBalanceEl.innerText = `${net.toLocaleString()} ريال`;
      if (net < 0) {
        netBalanceEl.style.color = '#dc3545';
      } else {
        netBalanceEl.style.color = '#28a745';
      }

      // 4. Populate Table
      if (expenses.length === 0) {
        expensesTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">لا توجد مصروفات مسجلة</td></tr>`;
      } else {
        expenses.forEach(exp => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${exp.expense_date}</td>
            <td><strong>${exp.expense_type}</strong></td>
            <td style="color:#d32f2f; font-weight:bold;">${parseFloat(exp.amount).toLocaleString()} ريال</td>
            <td>${exp.notes || '-'}</td>
          `;
          expensesTableBody.appendChild(row);
        });
      }

    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء جلب الدفعات والمصروفات، هل تأكدت من أن الجدول موجود وله صلاحية قراءة؟");
    } finally {
      tableLoading.style.display = 'none';
    }
  }
});
