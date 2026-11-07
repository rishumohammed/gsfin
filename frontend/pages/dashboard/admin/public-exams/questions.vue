<template>
  <div class="questions-page min-h-screen pb-16" style="background-color: #FAFAFD;">
    <!-- Page Header Bar -->
    <div class="exam-header-bar mb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="header-inner-row">
          <!-- Left: Back Button + Title & Subtitle + Optional Exam Badge -->
          <div class="header-left-col">
            <NuxtLink
              to="/dashboard/admin/public-exams"
              class="btn-header-back"
              title="Back to All Exams"
            >
              <i class="mdi mdi-arrow-left"></i>
            </NuxtLink>
            <div class="header-titles">
              <div class="header-title-row">
                <h1 class="header-page-title">Question Bank Manager</h1>
                <span v-if="selectedExam" class="badge-exam-pill">
                  <i class="mdi mdi-clipboard-text-outline"></i>
                  {{ selectedExam.name }}
                </span>
              </div>
              <p class="header-page-subtitle">
                Manage exam questions, set marking schemes, options explanations, and bulk import using CSV/JSON formats.
              </p>
            </div>
          </div>

          <!-- Right: Action Buttons -->
          <div class="header-actions-col" v-if="selectedExamId">
            <button
              type="button"
              class="btn-header-secondary"
              @click="openImportSection('json')"
            >
              <i class="mdi mdi-code-json"></i>
              <span>Bulk JSON</span>
            </button>
            <button
              type="button"
              class="btn-header-secondary"
              @click="openImportSection('csv')"
            >
              <i class="mdi mdi-file-delimited-outline"></i>
              <span>Bulk CSV</span>
            </button>
            <button
              type="button"
              class="btn-header-primary"
              @click="openQuestionDialog()"
            >
              <i class="mdi mdi-plus"></i>
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <!-- Bulk Import Section (JSON / CSV) -->
    <v-expand-transition>
      <div v-show="importOpen && selectedExamId" class="bulk-import-card mb-6">
        <div class="d-flex justify-space-between align-center mb-3">
          <div class="d-flex align-center gap-2">
            <span class="bulk-mode-pill">{{ importMode.toUpperCase() }} IMPORT</span>
            <h3 class="text-base font-semibold text-slate-900">
              Bulk Import Questions
            </h3>
          </div>
          <button type="button" class="btn-close-import" @click="importOpen = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <div v-if="importMode === 'json'">
          <p class="text-xs text-slate-500 mb-3 leading-relaxed font-medium">
            Paste a valid JSON array of question objects. Example format:<br/>
            <code class="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs">[ { "question_text": "Solve 2+2?", "type": "mcq", "options": ["3", "4", "5"], "correct_answer": "4", "explanation": "2+2 equals 4", "marks": 4, "difficulty_level": "Easy" } ]</code>
          </p>
          <textarea
            v-model="importJsonText"
            placeholder='[ { "question_text": "...", "type": "mcq", "options": [...], "correct_answer": "...", "marks": 4 } ]'
            rows="8"
            class="import-json-textarea mb-4 font-mono text-xs"
          ></textarea>
        </div>

        <div v-else>
          <p class="text-xs text-slate-500 mb-3 leading-relaxed font-medium">
            Upload a CSV file. Columns must map to: <span class="font-semibold text-slate-700">Type, Question, Options (separated by |), Correct Answer (separated by | for MSQ), Explanation, Marks, Difficulty</span>.<br/>
            The first row is ignored as the header. Valid Types: <code>mcq, msq, truefalse, fib</code>. Example:<br/>
            <code class="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs">Type,Question,Options,Correct Answer,Explanation,Marks,Difficulty<br/>"mcq","Which is a prime number?","2|4|6|8","2","2 is the only even prime.",4,"Easy"</code>
          </p>
          <div class="d-flex gap-3 mb-4">
            <button type="button" class="btn-csv-upload-box" @click="triggerCsvSelect">
              <i class="mdi mdi-cloud-upload text-xl text-slate-400"></i>
              <span class="text-sm font-semibold text-slate-700">Click to Select CSV File</span>
            </button>
            <button type="button" class="btn-header-secondary" @click="downloadSampleCsv">
              <i class="mdi mdi-download"></i>
              <span>Sample CSV</span>
            </button>
          </div>
          <input type="file" ref="csvFileInput" accept=".csv" class="d-none" @change="handleCsvUpload" />
          <div v-if="selectedCsvFileName" class="text-xs text-emerald-600 font-semibold mb-4 d-flex align-center gap-1">
            <i class="mdi mdi-check-circle"></i>
            <span>{{ selectedCsvFileName }} Selected</span>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <button type="button" class="btn-header-primary" :disabled="importing" @click="runBulkImport">
            <i :class="['mdi', importing ? 'mdi-loading spin-icon' : 'mdi-file-import-outline']"></i>
            <span>Import Questions</span>
          </button>
          <button type="button" class="btn-header-secondary" @click="importOpen = false">
            Cancel
          </button>
        </div>
      </div>
    </v-expand-transition>

    <!-- Search, Filter & Summary Bar -->
    <div class="filter-panel-card mb-6" v-if="selectedExamId && !loadingQuestions">
      <div class="filter-panel-grid">
        <!-- Search Input -->
        <div class="search-wrap">
          <i class="mdi mdi-magnify search-icon"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search questions by text or options..."
            class="filter-search-input"
          />
        </div>

        <!-- Difficulty Dropdown -->
        <div class="difficulty-wrap">
          <v-select
            v-model="difficultyFilter"
            :items="['All Difficulties', 'Easy', 'Medium', 'Hard']"
            density="compact"
            variant="outlined"
            rounded="lg"
            hide-details
            class="difficulty-select"
          ></v-select>
        </div>

        <!-- Summary Badges on the right -->
        <div class="summary-badges-col">
          <div class="summary-badge">
            <i class="mdi mdi-help-circle-outline"></i>
            <span class="summary-label">Bank Questions:</span>
            <span class="summary-value">{{ filteredQuestions.length }}</span>
          </div>
          <div class="summary-badge marks-badge">
            <i class="mdi mdi-star-circle-outline"></i>
            <span class="summary-label">Total Marks:</span>
            <span class="summary-value">{{ totalCalculatedMarks }}</span>
          </div>
          <!-- 3x Pool Progress Badge -->
          <div 
            :class="[
              'summary-badge pool-badge',
              questionsList.length >= (selectedExam?.total_questions || 0) * 3 && (selectedExam?.total_questions || 0) > 0
                ? 'pool-ready'
                : 'pool-needed'
            ]"
            :title="`Exam conducts ${selectedExam?.total_questions || 0} questions. Requires 3× (${(selectedExam?.total_questions || 0) * 3}) questions in the Question Bank before publishing.`"
          >
            <i :class="['mdi', questionsList.length >= (selectedExam?.total_questions || 0) * 3 && (selectedExam?.total_questions || 0) > 0 ? 'mdi-check-decagram' : 'mdi-alert-circle-outline']"></i>
            <span class="summary-label">3× Pool:</span>
            <span class="summary-value">{{ questionsList.length }} / {{ (selectedExam?.total_questions || 0) * 3 }}</span>
            <span v-if="questionsList.length >= (selectedExam?.total_questions || 0) * 3 && (selectedExam?.total_questions || 0) > 0" class="pool-tag-ready">Ready</span>
            <span v-else class="pool-tag-needed">Need {{ Math.max(0, ((selectedExam?.total_questions || 0) * 3) - questionsList.length) }} more</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingQuestions" class="text-center py-12">
      <v-progress-circular indeterminate color="#E31B23" size="48"></v-progress-circular>
      <div class="mt-4 text-slate-500 font-semibold text-sm">Loading questions...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="selectedExamId && filteredQuestions.length === 0" class="empty-state-panel">
      <div class="empty-state-icon-box">
        <i class="mdi mdi-database-alert-outline"></i>
      </div>
      <h3 class="empty-state-title">No Questions Found</h3>
      <p class="empty-state-desc">No questions match your filter criteria or there are no questions in this exam question bank yet.</p>
      <button
        type="button"
        class="btn-header-primary mt-2"
        @click="openQuestionDialog()"
      >
        <i class="mdi mdi-plus"></i>
        <span>Add First Question</span>
      </button>
    </div>

    <div v-else-if="!selectedExamId" class="empty-state-panel">
      <div class="empty-state-icon-box">
        <i class="mdi mdi-database-search-outline"></i>
      </div>
      <h3 class="empty-state-title">No Exam Selected</h3>
      <p class="empty-state-desc">You must select an exam from the All Exams list to manage its questions.</p>
      <NuxtLink to="/dashboard/admin/public-exams" class="btn-header-primary mt-2">
        <i class="mdi mdi-arrow-left"></i>
        <span>Back to All Exams</span>
      </NuxtLink>
    </div>

    <!-- Questions Listing -->
    <div v-else class="questions-list-wrap">
      <div
        v-for="(q, idx) in filteredQuestions"
        :key="q.id"
        class="question-item-card"
      >
        <div class="question-card-header">
          <div class="question-meta-tags">
            <span class="question-number-pill">Question {{ idx + 1 }}</span>
            <span class="badge-type-tag text-uppercase">{{ q.type }}</span>
            <span :class="['badge-difficulty-tag', 'diff-' + (q.difficulty_level || 'Medium').toLowerCase()]">
              {{ q.difficulty_level || 'Medium' }}
            </span>
            <span class="badge-marks-tag">
              <i class="mdi mdi-star-outline"></i>
              {{ q.marks }} Marks
            </span>
          </div>

          <!-- Question Controls -->
          <div class="question-card-actions">
            <button
              type="button"
              class="btn-card-action btn-copy"
              title="Duplicate Question"
              @click="duplicateQuestion(q)"
            >
              <i class="mdi mdi-content-copy"></i>
            </button>
            <button
              type="button"
              class="btn-card-action btn-edit"
              title="Edit Question"
              @click="openQuestionDialog(q)"
            >
              <i class="mdi mdi-pencil-outline"></i>
            </button>
            <button
              type="button"
              class="btn-card-action btn-delete"
              title="Delete Question"
              @click="confirmDelete(q)"
            >
              <i class="mdi mdi-trash-can-outline"></i>
            </button>
          </div>
        </div>

        <!-- Question Text -->
        <div class="question-prompt-text">{{ q.question_text }}</div>

        <!-- Options (if MCQ/MSQ/TF) -->
        <div v-if="q.options && q.options.length > 0" class="question-options-list">
          <div
            v-for="(opt, oIdx) in q.options"
            :key="oIdx"
            :class="['option-row-item', { 'is-correct': isCorrectAns(q, opt) }]"
          >
            <i :class="['mdi', isCorrectAns(q, opt) ? 'mdi-check-circle text-emerald-600' : 'mdi-circle-outline text-slate-400']"></i>
            <span>{{ opt }}</span>
          </div>
        </div>

        <!-- Correct Display for non-options -->
        <div v-else class="option-row-item is-correct mb-3">
          <i class="mdi mdi-check-circle text-emerald-600"></i>
          <span><strong>Correct Answer:</strong> {{ q.correct_answer }}</span>
        </div>

        <!-- Explanation -->
        <div v-if="q.explanation" class="question-explanation-box">
          <i class="mdi mdi-lightbulb-on-outline"></i>
          <div>
            <span class="font-semibold text-slate-800">Explanation:</span>
            <span class="text-slate-600 ml-1">{{ q.explanation }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ CREATE / EDIT QUESTION MODAL (GSFIN Global Style) ═══ -->
    <v-dialog v-model="questionDialog" max-width="680" persistent>
      <div class="modal-card">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-header-icon bg-red-50 text-red-600">
              <i :class="['mdi', editingQuestionId ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline']"></i>
            </div>
            <div class="modal-title-text">
              <h3>{{ editingQuestionId ? 'Edit Question' : 'Add Question to Bank' }}</h3>
              <p>Configure question prompt, answer choices, marking scheme, and explanations</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" @click="questionDialog = false" title="Close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <v-form ref="questionForm" v-model="questionFormValid" lazy-validation>
            <div class="form-group mb-4">
              <label class="form-label">Question Content <span class="text-red-500">*</span></label>
              <textarea
                v-model="questionFields.question_text"
                placeholder="Enter question text or scenario..."
                rows="3"
                class="form-textarea"
                required
              ></textarea>
            </div>

            <v-row class="mb-2">
              <v-col cols="12" sm="6">
                <div class="form-group">
                  <label class="form-label">Question Type <span class="text-red-500">*</span></label>
                  <select 
                    v-model="questionFields.type" 
                    class="form-select"
                    @change="onTypeChanged(questionFields.type)"
                  >
                    <option value="mcq">MCQ (Single Select)</option>
                    <option value="msq">Multiple Select (MSQ)</option>
                    <option value="truefalse">True / False</option>
                    <option value="fib">Fill in the Blank</option>
                  </select>
                </div>
              </v-col>
              <v-col cols="12" sm="3">
                <div class="form-group">
                  <label class="form-label">Marks <span class="text-red-500">*</span></label>
                  <input
                    v-model.number="questionFields.marks"
                    type="number"
                    min="1"
                    placeholder="1"
                    class="form-input"
                    required
                  />
                </div>
              </v-col>
              <v-col cols="12" sm="3">
                <div class="form-group">
                  <label class="form-label">Difficulty</label>
                  <select v-model="questionFields.difficulty_level" class="form-select">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </v-col>
            </v-row>

            <!-- Options Editor (MCQ / MSQ) -->
            <div v-if="['mcq', 'msq'].includes(questionFields.type)" class="mb-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <label class="form-label mb-0">Answer Options <span class="text-red-500">*</span></label>
                <button type="button" class="btn-text-action text-xs text-red-600 font-semibold" @click="addOptionField">
                  <i class="mdi mdi-plus"></i> Add Option
                </button>
              </div>
              
              <div v-for="(opt, idx) in questionFields.options" :key="idx" class="d-flex align-center mb-2 gap-2">
                <input
                  v-model="questionFields.options[idx]"
                  placeholder="Option text..."
                  class="form-input flex-grow-1"
                />
                <button 
                  type="button" 
                  class="btn-icon-danger"
                  @click="removeOptionField(idx)" 
                  :disabled="questionFields.options.length <= 2"
                  title="Remove option"
                >
                  <i class="mdi mdi-trash-can-outline"></i>
                </button>
              </div>
            </div>

            <!-- Correct Answer Selection -->
            <!-- A. MCQ Selector -->
            <div v-if="questionFields.type === 'mcq'" class="form-group mb-4">
              <label class="form-label">Correct Answer <span class="text-red-500">*</span></label>
              <select v-model="questionFields.correct_answer" class="form-select">
                <option value="" disabled>-- Select Correct Answer --</option>
                <option v-for="opt in filteredOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>

            <!-- B. MSQ Selector -->
            <div v-if="questionFields.type === 'msq'" class="form-group mb-4">
              <label class="form-label">Correct Answers (Check all that apply) <span class="text-red-500">*</span></label>
              <div class="msq-options-wrap">
                <label v-for="opt in filteredOptions" :key="opt" class="msq-option-label">
                  <input
                    type="checkbox"
                    :value="opt"
                    v-model="questionFields.correct_answer_msq"
                    class="msq-checkbox"
                  />
                  <span>{{ opt }}</span>
                </label>
              </div>
            </div>

            <!-- C. True / False Selector -->
            <div v-if="questionFields.type === 'truefalse'" class="form-group mb-4">
              <label class="form-label">Correct Answer <span class="text-red-500">*</span></label>
              <select v-model="questionFields.correct_answer" class="form-select">
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>

            <!-- D. FIB Text Input -->
            <div v-if="questionFields.type === 'fib'" class="form-group mb-4">
              <label class="form-label">Correct Blank Text (Case-insensitive) <span class="text-red-500">*</span></label>
              <input
                v-model="questionFields.correct_answer"
                type="text"
                placeholder="Enter exact blank text..."
                class="form-input"
              />
            </div>

            <div class="form-group mb-2">
              <label class="form-label">Answer Explanation (Shown in review)</label>
              <textarea
                v-model="questionFields.explanation"
                placeholder="Explain why this answer is correct..."
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>
          </v-form>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-glass" @click="questionDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-red"
            :disabled="savingQuestion"
            @click="saveQuestion"
          >
            <i :class="['mdi', savingQuestion ? 'mdi-loading spin-icon' : 'mdi-check-circle-outline']"></i>
            <span>{{ savingQuestion ? 'Saving Question...' : 'Save Question' }}</span>
          </button>
        </div>
      </div>
    </v-dialog>

    <!-- ═══ DELETE CONFIRMATION MODAL (GSFIN Global Style) ═══ -->
    <v-dialog v-model="deleteConfirmDialog" max-width="500">
      <div class="modal-card">
        <!-- Modal Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <div class="modal-header-icon bg-red-50 text-red-600">
              <i class="mdi mdi-alert-octagon-outline"></i>
            </div>
            <div class="modal-title-text">
              <h3>Delete Question?</h3>
              <p>Permanent action • cannot be undone</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" @click="deleteConfirmDialog = false" title="Close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <p class="modal-lead-text">
            Are you sure you want to permanently delete this question from the Question Bank?
          </p>

          <div class="modal-info-card border-red">
            <div class="modal-info-card-meta">
              <span class="badge-program-tag">
                <i class="mdi mdi-help-circle-outline"></i>
                {{ targetQuestion?.type?.toUpperCase() || 'MCQ' }}
              </span>
              <span class="text-xs text-slate-500 font-semibold">{{ targetQuestion?.marks || 1 }} Marks</span>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-xs text-slate-500 font-semibold">{{ targetQuestion?.difficulty_level || 'Medium' }}</span>
            </div>
            <div class="modal-info-card-title text-sm line-clamp-3 leading-relaxed">
              {{ targetQuestion?.question_text }}
            </div>
          </div>

          <div class="modal-danger-callout">
            <i class="mdi mdi-alert-circle text-red-500"></i>
            <div>
              <strong>Pool Alert:</strong> Removing questions reduces the Question Bank pool. If the pool drops below 3× ({{ (selectedExam?.total_questions || 0) * 3 }} questions), this exam cannot be published.
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button type="button" class="btn-glass" @click="deleteConfirmDialog = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn-danger-confirm"
            :disabled="deleting"
            @click="deleteQuestion"
          >
            <i :class="['mdi', deleting ? 'mdi-loading spin-icon' : 'mdi-trash-can-outline']"></i>
            <span>{{ deleting ? 'Deleting...' : 'Delete Question' }}</span>
          </button>
        </div>
      </div>
    </v-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import Papa from 'papaparse';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  role: ['super_admin', 'main_admin', 'sub_admin', 'lms_user']
});

const route = useRoute();
const api = useApi();

const exams = ref<any[]>([]);
const selectedExamId = ref('');
const selectedExam = computed(() => exams.value.find(e => e.id === selectedExamId.value));
const loadingQuestions = ref(false);
const questionsList = ref<any[]>([]);

const search = ref('');
const difficultyFilter = ref('All Difficulties');

// Bulk Import State
const importOpen = ref(false);
const importMode = ref<'json' | 'csv'>('json');
const importJsonText = ref('');
const csvFileInput = ref<HTMLInputElement | null>(null);
const selectedCsvFileName = ref('');
const parsedCsvData = ref<any[]>([]);
const importing = ref(false);

function triggerCsvSelect() {
  if (csvFileInput.value) {
    csvFileInput.value.click();
  }
}

// Question Dialog State
const questionDialog = ref(false);
const editingQuestionId = ref<string | null>(null);
const questionFormValid = ref(false);
const questionForm = ref<any>(null);
const savingQuestion = ref(false);
const questionFields = ref<any>({
  question_text: '',
  type: 'mcq',
  options: ['', ''],
  correct_answer: '',
  correct_answer_msq: [],
  explanation: '',
  marks: 4,
  difficulty_level: 'Medium'
});

const filteredOptions = computed(() => {
  return (questionFields.value.options || []).filter((o: string) => !!o.trim());
});

// Delete State
const deleteConfirmDialog = ref(false);
const targetQuestion = ref<any>(null);
const deleting = ref(false);

const filteredQuestions = computed(() => {
  return questionsList.value.filter(q => {
    const matchesSearch = !search.value || q.question_text.toLowerCase().includes(search.value.toLowerCase());
    const matchesDiff = difficultyFilter.value === 'All Difficulties' || q.difficulty_level === difficultyFilter.value;
    return matchesSearch && matchesDiff;
  });
});

const totalCalculatedMarks = computed(() => {
  return filteredQuestions.value.reduce((acc, q) => acc + (parseInt(q.marks) || 0), 0);
});

async function loadExams() {
  try {
    const { data } = await api.get('/admin/public-exams');
    exams.value = data;
    
    // Require exam from route query parameters
    if (route.query.examId) {
      selectedExamId.value = route.query.examId as string;
      fetchQuestions();
    }
  } catch (err) {
    console.error('Failed to load exams:', err);
  }
}

async function fetchQuestions() {
  if (!selectedExamId.value) return;
  loadingQuestions.value = true;
  try {
    const { data } = await api.get(`/admin/public-exams/${selectedExamId.value}/questions`);
    questionsList.value = data;
  } catch (err) {
    console.error('Failed to load questions:', err);
  } finally {
    loadingQuestions.value = false;
  }
}

function onExamChange() {
  importOpen.value = false;
  fetchQuestions();
}

function openImportSection(mode: 'json' | 'csv') {
  importMode.value = mode;
  importJsonText.value = '';
  selectedCsvFileName.value = '';
  parsedCsvData.value = [];
  if (csvFileInput.value) (csvFileInput.value as any).value = '';
  importOpen.value = true;
}

function downloadSampleCsv() {
  const headers = ['Type', 'Question', 'Options', 'Correct Answer', 'Explanation', 'Marks', 'Difficulty'];
  const rows = [
    ['mcq', 'Which is a prime number?', '2|4|6|8', '2', '2 is the only even prime.', '4', 'Easy'],
    ['msq', 'Select all vowels.', 'A|B|C|E|F', 'A|E', 'A and E are vowels.', '4', 'Medium'],
    ['truefalse', 'The earth is flat.', 'True|False', 'False', 'The earth is spherical.', '2', 'Easy'],
    ['fib', 'The chemical symbol for water is __.', '', 'H2O', 'Water is composed of 2 hydrogen and 1 oxygen.', '4', 'Medium']
  ];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_questions.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleCsvUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  selectedCsvFileName.value = file.name;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.errors.length > 0) {
        alert('Error parsing CSV. Please ensure it follows the format.');
        console.error(results.errors);
        return;
      }
      
      const newQuestions = results.data.map((row: any) => {
        const rawOptions = row['Options'] || '';
        const rawCorrect = row['Correct Answer'] || '';
        
        const options = rawOptions ? rawOptions.split('|').map((o: string) => o.trim()) : [];
        let type = row['Type'] ? row['Type'].toLowerCase().trim() : 'fib';
        let correctVal: any = rawCorrect;

        if (options.length > 0) {
          if (!row['Type']) {
            if (options.length === 2 && options.includes('True') && options.includes('False')) {
              type = 'truefalse';
            } else if (rawCorrect.includes('|')) {
              type = 'msq';
            } else {
              type = 'mcq';
            }
          }
        }

        if (type === 'msq' && typeof rawCorrect === 'string' && rawCorrect.includes('|')) {
          correctVal = rawCorrect.split('|').map((o: string) => o.trim());
        }

        return {
          question_text: row['Question'] || 'Untitled',
          type,
          options,
          correct_answer: correctVal,
          explanation: row['Explanation'] || '',
          marks: parseInt(row['Marks']) || 4,
          difficulty_level: row['Difficulty'] || 'Medium'
        };
      });

      parsedCsvData.value = newQuestions;
    }
  });
}

async function runBulkImport() {
  if (importMode.value === 'json') {
    if (!importJsonText.value.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText.value.trim());
      importing.value = true;
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions/bulk`, { questions: parsed });
      alert('Questions imported successfully!');
      importOpen.value = false;
      fetchQuestions();
    } catch (err: any) {
      console.error('JSON import error:', err);
      alert(err.response?.data?.message || 'Invalid JSON format or parameters.');
    } finally {
      importing.value = false;
    }
  } else {
    if (parsedCsvData.value.length === 0) {
      alert('Please select a valid CSV file first.');
      return;
    }
    importing.value = true;
    try {
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions/bulk`, { questions: parsedCsvData.value });
      alert(`Successfully imported ${parsedCsvData.value.length} questions from CSV!`);
      importOpen.value = false;
      fetchQuestions();
    } catch (err: any) {
      console.error('CSV import error:', err);
      alert(err.response?.data?.message || 'Error occurred while uploading CSV.');
    } finally {
      importing.value = false;
    }
  }
}

function openQuestionDialog(question: any = null) {
  if (question) {
    editingQuestionId.value = question.id;
    
    // Parse Correct Answer MSQ if MSQ type
    let correctMsq = [];
    if (question.type === 'msq') {
      try {
        correctMsq = Array.isArray(question.correct_answer) 
          ? question.correct_answer 
          : JSON.parse(question.correct_answer);
      } catch (e) {
        correctMsq = [question.correct_answer];
      }
    }

    questionFields.value = {
      question_text: question.question_text,
      type: question.type,
      options: question.options && question.options.length > 0 ? [...question.options] : ['', ''],
      correct_answer: question.type !== 'msq' ? question.correct_answer : '',
      correct_answer_msq: correctMsq,
      explanation: question.explanation || '',
      marks: question.marks || 4,
      difficulty_level: question.difficulty_level || 'Medium'
    };
  } else {
    editingQuestionId.value = null;
    questionFields.value = {
      question_text: '',
      type: 'mcq',
      options: ['', ''],
      correct_answer: '',
      correct_answer_msq: [],
      explanation: '',
      marks: 4,
      difficulty_level: 'Medium'
    };
  }
  questionDialog.value = true;
}

function onTypeChanged(type: string) {
  if (type === 'truefalse') {
    questionFields.value.options = ['True', 'False'];
  } else if (['mcq', 'msq'].includes(type)) {
    if (!questionFields.value.options || questionFields.value.options.length < 2) {
      questionFields.value.options = ['', ''];
    }
  } else {
    questionFields.value.options = [];
  }
  questionFields.value.correct_answer = '';
  questionFields.value.correct_answer_msq = [];
}

function addOptionField() {
  questionFields.value.options.push('');
}

function removeOptionField(idx: number | string) {
  const index = typeof idx === 'string' ? parseInt(idx, 10) : idx;
  questionFields.value.options.splice(index, 1);
}

async function saveQuestion() {
  const { valid } = await questionForm.value.validate();
  if (!valid) return;

  savingQuestion.value = true;
  try {
    const payload = { ...questionFields.value };
    if (payload.type === 'msq') {
      payload.correct_answer = payload.correct_answer_msq;
    }
    delete payload.correct_answer_msq;

    if (editingQuestionId.value) {
      await api.put(`/admin/public-exams/${selectedExamId.value}/questions/${editingQuestionId.value}`, payload);
      alert('Question updated successfully!');
    } else {
      await api.post(`/admin/public-exams/${selectedExamId.value}/questions`, payload);
      alert('Question added successfully!');
    }
    questionDialog.value = false;
    fetchQuestions();
  } catch (err: any) {
    console.error('Save question error:', err);
    alert(err.response?.data?.message || 'Error occurred while saving question.');
  } finally {
    savingQuestion.value = false;
  }
}

async function duplicateQuestion(q: any) {
  try {
    let rawCorrect = q.correct_answer;
    if (q.type === 'msq') {
      try {
        rawCorrect = Array.isArray(q.correct_answer) ? q.correct_answer : JSON.parse(q.correct_answer);
      } catch (e) {}
    }

    const payload = {
      question_text: `${q.question_text} (Copy)`,
      type: q.type,
      options: q.options,
      correct_answer: rawCorrect,
      explanation: q.explanation || '',
      marks: q.marks || 4,
      difficulty_level: q.difficulty_level || 'Medium'
    };
    
    await api.post(`/admin/public-exams/${selectedExamId.value}/questions`, payload);
    alert('Question duplicated successfully!');
    fetchQuestions();
  } catch (err: any) {
    console.error('Duplicate question error:', err);
    alert(err.response?.data?.message || 'Failed to duplicate question.');
  }
}

function confirmDelete(question: any) {
  targetQuestion.value = question;
  deleteConfirmDialog.value = true;
}

async function deleteQuestion() {
  if (!targetQuestion.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/public-exams/${selectedExamId.value}/questions/${targetQuestion.value.id}`);
    deleteConfirmDialog.value = false;
    targetQuestion.value = null;
    fetchQuestions();
  } catch (err) {
    console.error('Delete question error:', err);
  } finally {
    deleting.value = false;
  }
}

function isCorrectAns(q: any, opt: string) {
  if (!q.correct_answer) return false;
  const clean = (s: string) => s.trim().toLowerCase();
  
  if (q.type === 'msq') {
    try {
      const arr = Array.isArray(q.correct_answer) ? q.correct_answer : JSON.parse(q.correct_answer);
      return Array.isArray(arr) && arr.map(x => clean(x)).includes(clean(opt));
    } catch (e) {
      return clean(q.correct_answer) === clean(opt);
    }
  }
  return clean(q.correct_answer) === clean(opt);
}

function getDifficultyColor(diff: string) {
  if (diff === 'Easy') return 'success';
  if (diff === 'Medium') return 'warning';
  if (diff === 'Hard') return 'error';
  return 'grey';
}

onMounted(() => {
  loadExams();
});
</script>

<style scoped>
/* Page Header Bar */
.exam-header-bar {
  background: #FFFFFF;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding: 20px 0;
}

.header-inner-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-left-col {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.btn-header-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #CBD5E1;
  background-color: #FFFFFF;
  color: #334155;
  font-size: 1.25rem;
  text-decoration: none;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-header-back:hover {
  background-color: #F8FAFC;
  border-color: #94A3B8;
  color: #0F172A;
}

.header-titles {
  flex: 1;
  min-width: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.badge-exam-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 50px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border: 1px solid rgba(227, 27, 35, 0.2);
  white-space: nowrap;
}

.badge-exam-pill i {
  color: #E31B23;
  font-size: 0.85rem;
}

.header-page-subtitle {
  font-size: 0.84rem;
  color: #64748B;
  margin: 4px 0 0 0;
  font-weight: 500;
  line-height: 1.4;
}

.header-actions-col {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.btn-header-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #CBD5E1;
  background-color: #FFFFFF;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-header-secondary:hover {
  background-color: #F8FAFC;
  border-color: #94A3B8;
  color: #0F172A;
}

.btn-header-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 12px;
  background-color: #E31B23;
  color: #FFFFFF;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(227, 27, 35, 0.25);
  transition: all 0.2s ease;
  white-space: nowrap;
  text-decoration: none;
}

.btn-header-primary:hover:not(:disabled) {
  background-color: #C4131B;
}

.btn-header-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Filter & Summary Bar */
.filter-panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 14px 20px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.filter-panel-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 440px;
}

.filter-search-input {
  width: 100%;
  height: 40px;
  padding: 8px 14px 8px 38px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  font-size: 0.86rem;
  font-weight: 500;
  background: #F8FAFC;
  outline: none;
  transition: all 0.2s ease;
  color: #1E293B;
}

.filter-search-input:focus {
  background: #FFFFFF;
  border-color: #E31B23;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 1.15rem;
  pointer-events: none;
}

.difficulty-wrap {
  width: 180px;
  flex-shrink: 0;
}

.summary-badges-col {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
}

.summary-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  font-size: 0.82rem;
  color: #475569;
}

.summary-badge i {
  font-size: 1.1rem;
  color: #64748B;
}

.summary-label {
  font-weight: 500;
  color: #64748B;
}

.summary-value {
  font-weight: 600;
  color: #0F172A;
}

.summary-badge.marks-badge {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.25);
}

.summary-badge.marks-badge i {
  color: #D97706;
}

.summary-badge.marks-badge .summary-value {
  color: #B45309;
}

.summary-badge.pool-badge {
  padding: 6px 12px;
  border-radius: 10px;
}

.summary-badge.pool-ready {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  color: #065F46;
}

.summary-badge.pool-ready i {
  color: #059669;
}

.summary-badge.pool-needed {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  color: #92400E;
}

.summary-badge.pool-needed i {
  color: #D97706;
}

.pool-tag-ready {
  font-size: 0.65rem;
  background: #D1FAE5;
  color: #065F46;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
  margin-left: 4px;
}

.pool-tag-needed {
  font-size: 0.65rem;
  background: #FEF3C7;
  color: #92400E;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
  margin-left: 4px;
}

/* Question Cards */
.questions-list-wrap {
  display: flex;
  flex-direction: column;
}

.question-item-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
  transition: all 0.2s ease;
}

.question-item-card:hover {
  border-color: rgba(15, 23, 42, 0.16);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.question-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.question-meta-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.question-number-pill {
  font-size: 0.82rem;
  font-weight: 600;
  color: #0F172A;
  background: #F1F5F9;
  padding: 4px 10px;
  border-radius: 8px;
}

.badge-type-tag {
  font-size: 0.70rem;
  font-weight: 600;
  color: #1D4ED8;
  background: rgba(29, 78, 216, 0.08);
  border: 1px solid rgba(29, 78, 216, 0.18);
  padding: 3px 8px;
  border-radius: 6px;
}

.badge-difficulty-tag {
  font-size: 0.70rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.badge-difficulty-tag.diff-easy {
  color: #059669;
  background: rgba(5, 150, 105, 0.08);
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.badge-difficulty-tag.diff-medium {
  color: #D97706;
  background: rgba(217, 119, 6, 0.08);
  border: 1px solid rgba(217, 119, 6, 0.2);
}

.badge-difficulty-tag.diff-hard {
  color: #DC2626;
  background: rgba(220, 38, 38, 0.08);
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.badge-marks-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #475569;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 3px 8px;
  border-radius: 6px;
}

.question-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-card-action {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.btn-card-action.btn-copy {
  background: rgba(245, 158, 11, 0.08);
  color: #D97706;
  border-color: rgba(245, 158, 11, 0.2);
}

.btn-card-action.btn-copy:hover {
  background: #D97706;
  color: #FFFFFF;
}

.btn-card-action.btn-edit {
  background: rgba(59, 130, 246, 0.08);
  color: #2563EB;
  border-color: rgba(59, 130, 246, 0.2);
}

.btn-card-action.btn-edit:hover {
  background: #2563EB;
  color: #FFFFFF;
}

.btn-card-action.btn-delete {
  background: rgba(239, 68, 68, 0.08);
  color: #DC2626;
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-card-action.btn-delete:hover {
  background: #DC2626;
  color: #FFFFFF;
}

.question-prompt-text {
  font-size: 0.94rem;
  font-weight: 500;
  color: #0F172A;
  line-height: 1.55;
  margin-bottom: 14px;
  white-space: pre-line;
}

.question-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.option-row-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #334155;
  background: #F8FAFC;
  border: 1px solid #F1F5F9;
}

.option-row-item.is-correct {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  color: #065F46;
  font-weight: 600;
}

.question-explanation-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #F8FAFC;
  border-left: 4px solid #6366F1;
  font-size: 0.82rem;
  color: #334155;
}

.question-explanation-box i {
  color: #6366F1;
  font-size: 1.15rem;
  margin-top: 1px;
}

/* Bulk Import Panel */
.bulk-import-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.bulk-mode-pill {
  font-size: 0.70rem;
  font-weight: 600;
  color: #4F46E5;
  background: rgba(79, 70, 229, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
}

.btn-close-import {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #FFFFFF;
  color: #64748B;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn-close-import:hover {
  background: #F1F5F9;
  color: #0F172A;
}

.import-json-textarea {
  width: 100%;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  padding: 12px;
  background: #F8FAFC;
  outline: none;
}

.import-json-textarea:focus {
  background: #FFFFFF;
  border-color: #E31B23;
}

.btn-csv-upload-box {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 2px dashed #CBD5E1;
  background: #F8FAFC;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-csv-upload-box:hover {
  border-color: #E31B23;
  background: #FFF5F5;
}

/* Empty States */
.empty-state-panel {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
}

.empty-state-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 6px;
}

.empty-state-desc {
  font-size: 0.85rem;
  color: #64748B;
  max-width: 420px;
  margin: 0 auto 16px auto;
  font-weight: 500;
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .header-inner-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions-col {
    width: 100%;
    justify-content: flex-start;
  }
  .summary-badges-col {
    width: 100%;
    margin-left: 0;
  }
}

/* ── GSFIN Global Modal Architecture in Questions ── */
.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FAFAFD;
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.modal-title-text h3 {
  font-size: 1.05rem;
  font-weight: 600;
  color: #0F172A;
  margin: 0;
  line-height: 1.25;
}

.modal-title-text p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 2px 0 0 0;
  line-height: 1.2;
}

.modal-close-btn {
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.modal-body {
  padding: 22px 24px;
  max-height: 75vh;
  overflow-y: auto;
}

.modal-lead-text {
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.5;
  margin-bottom: 16px;
}

.modal-info-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  margin-bottom: 16px;
}

.modal-info-card.border-red {
  border-left: 4px solid #E31B23;
}

.modal-info-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.modal-info-card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0F172A;
}

.modal-danger-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 10px;
  font-size: 0.78rem;
  color: #991B1B;
  line-height: 1.45;
}

.modal-danger-callout i {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.btn-danger-confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(227, 27, 35, 0.25);
}

.btn-danger-confirm:hover:not(:disabled) {
  background: #C41219;
  transform: translateY(-1px);
}

.btn-danger-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 0.80rem;
  font-weight: 600;
  color: #334155;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 9px 13px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #F8FAFC;
  font-size: 0.85rem;
  color: #0F172A;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: #E31B23;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(227, 27, 35, 0.08);
}

.btn-text-action {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-icon-danger {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #FEE2E2;
  background: #FEF2F2;
  color: #EF4444;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-icon-danger:hover:not(:disabled) {
  background: #EF4444;
  color: #FFFFFF;
}

.btn-icon-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.msq-options-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 10px;
}

.msq-option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
  font-weight: 500;
}

.msq-checkbox {
  accent-color: #E31B23;
  width: 16px;
  height: 16px;
}
</style>
