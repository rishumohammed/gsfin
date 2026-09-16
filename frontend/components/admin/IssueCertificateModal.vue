<template>
  <Teleport to="body">
    <div v-if="show" class="gsfin-modal-overlay" @click.self="show = false">
      <div class="gsfin-modal-card">
        <div class="modal-header">
          <div class="header-title-flex">
            <div class="modal-icon-badge">
              <i class="mdi mdi-certificate-outline"></i>
            </div>
            <div>
              <h3 class="modal-title">Manual Certificate Issuance</h3>
              <p class="modal-subtitle">Issue a verified credential directly to a candidate.</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="show = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group mb-5">
            <label class="form-label">Select Candidate / Student <span class="text-red">*</span></label>
            <div class="select-wrapper">
              <select v-model="selectedStudent" class="form-select" :disabled="loadingStudents">
                <option :value="null">-- Choose Student Account --</option>
                <option v-for="student in students" :key="student.id" :value="student.id">
                  {{ student.name }} ({{ student.email }})
                </option>
              </select>
              <i class="mdi mdi-chevron-down select-icon"></i>
            </div>
          </div>

          <div class="form-group mb-2">
            <label class="form-label">Select Qualification / Course <span class="text-red">*</span></label>
            <div class="select-wrapper">
              <select v-model="selectedCourse" class="form-select" :disabled="loadingCourses || !selectedStudent">
                <option :value="null">-- Select Enrolled Course --</option>
                <option v-for="course in filteredCourses" :key="course.id" :value="course.id">
                  {{ course.title }}
                </option>
              </select>
              <i class="mdi mdi-chevron-down select-icon"></i>
            </div>
            <p v-if="selectedStudent && filteredCourses.length === 0 && !loadingCourses" class="hint-text">
              <i class="mdi mdi-information-outline"></i> Candidate is not currently enrolled in any published courses.
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="show = false">Cancel</button>
          <button
            class="btn-red"
            :disabled="issuing || !selectedStudent || !selectedCourse"
            @click="issueCertificate"
          >
            <span v-if="issuing" class="spinner-sm-white"></span>
            <i v-else class="mdi mdi-check-circle-outline"></i>
            <span>Issue Certificate Now</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useApi } from '@/composables/useApi';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'issued']);

const show = ref(props.modelValue);
const api = useApi();

const students = ref<any[]>([]);
const courses = ref<any[]>([]);
const loadingStudents = ref(false);
const loadingCourses = ref(false);
const issuing = ref(false);

const selectedStudent = ref<any>(null);
const selectedCourse = ref<any>(null);
const enrolledCourseIds = ref<string[]>([]);

const filteredCourses = computed(() => {
  let list = courses.value.filter(c => c.status === 'published' || !c.status);
  if (selectedStudent.value && enrolledCourseIds.value.length > 0) {
    list = list.filter(c => enrolledCourseIds.value.includes(c.id));
  }
  return list;
});

watch(() => props.modelValue, (val) => {
  show.value = val;
  if (val) {
    loadData();
  }
});

watch(show, (val) => {
  emit('update:modelValue', val);
});

watch(selectedStudent, async (newVal) => {
  selectedCourse.value = null;
  if (newVal) {
    loadingCourses.value = true;
    try {
      const res = await api.get(`/admin/students/${newVal}/courses`);
      enrolledCourseIds.value = (res.data || res || []).map((c: any) => c.id);
    } catch (error) {
      console.error('Failed to load student courses:', error);
      enrolledCourseIds.value = [];
    } finally {
      loadingCourses.value = false;
    }
  } else {
    enrolledCourseIds.value = [];
  }
});

const loadData = async () => {
  loadStudents();
  loadCourses();
};

const loadStudents = async () => {
  loadingStudents.value = true;
  try {
    const { data } = await api.get('/admin/students?limit=100');
    students.value = data?.students || [];
  } catch (error) {
    console.error('Failed to load students:', error);
  } finally {
    loadingStudents.value = false;
  }
};

const loadCourses = async () => {
  loadingCourses.value = true;
  try {
    const res = await api.get('/lms/courses');
    courses.value = res.data || res || [];
  } catch (error) {
    console.error('Failed to load courses:', error);
  } finally {
    loadingCourses.value = false;
  }
};

const issueCertificate = async () => {
  if (!selectedStudent.value || !selectedCourse.value) return;

  issuing.value = true;
  try {
    await api.post('/certs/admin/issue-manual', {
      studentId: selectedStudent.value,
      courseId: selectedCourse.value
    });
    
    emit('issued');
    show.value = false;
    selectedStudent.value = null;
    selectedCourse.value = null;
    
    alert('Certificate issued successfully!');
  } catch (error: any) {
    console.error('Failed to issue certificate:', error);
    alert(error.response?.data?.message || 'Failed to issue certificate');
  } finally {
    issuing.value = false;
  }
};
</script>

<style scoped>
.gsfin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.gsfin-modal-card {
  background: #FFFFFF;
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.header-title-flex {
  display: flex;
  align-items: center;
  gap: 14px;
}

.modal-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(227, 27, 35, 0.1);
  color: #E31B23;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.8rem;
  color: #64748B;
  margin: 2px 0 0 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #94A3B8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.15s ease;
}
.modal-close-btn:hover { background: #E2E8F0; color: #0F172A; }

.modal-body {
  padding: 28px;
}

.form-group { display: flex; flex-direction: column; }
.form-label { font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 8px; }
.text-red { color: #E31B23; }

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-select {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #FFFFFF;
  font-size: 0.9rem;
  color: #0F172A;
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.form-select:focus { border-color: #E31B23; }
.form-select:disabled { background: #F1F5F9; cursor: not-allowed; }

.select-icon {
  position: absolute;
  right: 14px;
  pointer-events: none;
  color: #64748B;
  font-size: 1.2rem;
}

.hint-text {
  font-size: 0.78rem;
  color: #D97706;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: #FAFAFD;
}

.btn-cancel {
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-cancel:hover { background: #F1F5F9; color: #0F172A; }

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 11px 22px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 3px 10px rgba(227, 27, 35, 0.2);
  cursor: pointer;
  transition: all 0.18s ease;
}
.btn-red:hover:not(:disabled) { background: #C4131B; transform: translateY(-1px); }
.btn-red:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

.spinner-sm-white {
  width: 14px; height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
