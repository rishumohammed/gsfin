<template>
  <v-container fluid class="py-8 px-6 bg-grey-lighten-4 min-vh-100">
    <!-- Header Section -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-4">
      <div>
        <div class="d-flex align-center gap-2 mb-1">
          <v-icon color="red-darken-1" size="28">mdi-certificate-outline</v-icon>
          <h1 class="text-h4 font-weight-bold text-slate-900 tracking-tight">GSFIN Qualifications</h1>
        </div>
        <p class="text-secondary mb-0">Manage global food safety & quality certification standards, detail pages, and curricula.</p>
      </div>
      <div class="d-flex gap-3">
        <v-btn
          to="/qualifications"
          target="_blank"
          variant="outlined"
          color="grey-darken-2"
          height="42"
          rounded="lg"
          prepend-icon="mdi-open-in-new"
          class="text-none font-weight-bold"
        >
          View Public Catalog
        </v-btn>
        <v-btn
          color="red-darken-1"
          prepend-icon="mdi-plus"
          height="42"
          rounded="lg"
          elevation="0"
          class="px-5 text-none font-weight-bold"
          @click="openDialog()"
        >
          Add Qualification
        </v-btn>
      </div>
    </div>

    <!-- Alert Banner -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4 rounded-lg" closable @click:close="error = null">
      {{ error }}
    </v-alert>

    <!-- Data Table Card -->
    <v-card class="rounded-xl border-surface bg-white" variant="outlined">
      <v-card-title class="px-6 pt-5 pb-3 d-flex align-center justify-space-between flex-wrap gap-4">
        <div class="d-flex align-center gap-3">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search qualifications..."
            variant="outlined"
            density="compact"
            hide-details
            style="width: 280px"
            rounded="lg"
          ></v-text-field>
          <v-select
            v-model="categoryFilter"
            :items="['All Categories', 'Food Safety', 'Quality Management', 'Food Science']"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 200px"
            rounded="lg"
          ></v-select>
        </div>
        <span class="text-caption text-grey-darken-1">Total: {{ filteredQualifications.length }} Qualifications</span>
      </v-card-title>

      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="filteredQualifications"
        :loading="loading"
        hover
        density="comfortable"
        class="clean-table"
      >
        <!-- Name & Badge Column -->
        <template v-slot:item.name="{ item }">
          <div class="py-2">
            <div class="d-flex align-center gap-2">
              <v-icon color="red-darken-1" size="20">{{ item.icon_name || 'mdi-certificate' }}</v-icon>
              <span class="font-weight-bold text-slate-900 text-subtitle-2">{{ item.name }}</span>
            </div>
            <div class="text-caption text-grey-darken-1 text-truncate" style="max-width: 280px;">
              {{ item.subtitle || item.short_description }}
            </div>
            <v-chip v-if="item.badge_tag" size="x-small" color="red-lighten-4" text-color="red-darken-3" class="mt-1 font-weight-bold">
              {{ item.badge_tag }}
            </v-chip>
          </div>
        </template>

        <!-- Category & Level -->
        <template v-slot:item.category="{ item }">
          <div>
            <div class="font-weight-medium text-body-2">{{ item.category }}</div>
            <v-chip size="x-small" variant="tonal" color="slate-700" class="mt-1">
              {{ item.level }}
            </v-chip>
          </div>
        </template>

        <!-- Duration & Validity -->
        <template v-slot:item.duration="{ item }">
          <div class="text-caption">
            <div><v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>{{ item.duration || 'N/A' }}</div>
            <div class="text-grey"><v-icon size="14" class="mr-1">mdi-shield-check-outline</v-icon>{{ item.validity || 'Lifetime' }}</div>
          </div>
        </template>

        <!-- Status Switch -->
        <template v-slot:item.is_active="{ item }">
          <v-switch
            v-model="item.is_active"
            color="success"
            hide-details
            density="compact"
            @change="toggleActive(item)"
          ></v-switch>
        </template>

        <!-- Order Column -->
        <template v-slot:item.order_index="{ item, index }">
          <div class="d-flex align-center gap-1">
            <span class="font-weight-bold text-caption mr-1">{{ item.order_index }}</span>
            <v-btn icon="mdi-chevron-up" variant="text" size="x-small" :disabled="index === 0" @click="moveUp(index)"></v-btn>
            <v-btn icon="mdi-chevron-down" variant="text" size="x-small" :disabled="index === qualifications.length - 1" @click="moveDown(index)"></v-btn>
          </div>
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <v-btn
              :to="`/qualifications/${item.slug}`"
              target="_blank"
              icon="mdi-open-in-new"
              variant="text"
              size="small"
              color="grey-darken-1"
              title="Preview Detail Page"
            ></v-btn>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              title="Edit Qualification"
              @click="openDialog(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              title="Delete Qualification"
              @click="confirmDelete(item)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-8 text-center text-grey-darken-1">
            <v-icon size="48" class="mb-3 opacity-50">mdi-certificate-outline</v-icon>
            <br>
            No qualifications found. Click "Add Qualification" to create one.
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog" max-width="900" persistent scrollable>
      <v-card class="rounded-xl">
        <v-card-title class="text-h5 font-weight-bold pt-5 px-6 pb-3 d-flex align-center justify-space-between border-bottom">
          <div class="d-flex align-center gap-2">
            <v-icon color="red-darken-1">{{ editedItem.id ? 'mdi-pencil-box-outline' : 'mdi-plus-box-outline' }}</v-icon>
            <span>{{ editedItem.id ? `Edit: ${editedItem.name}` : 'Create New Qualification' }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" :disabled="saving"></v-btn>
        </v-card-title>

        <v-card-text class="px-6 py-4">
          <v-tabs v-model="tab" color="red-darken-1" class="mb-6">
            <v-tab value="basic" class="text-none font-weight-bold">Basic Metadata</v-tab>
            <v-tab value="descriptions" class="text-none font-weight-bold">Overview & Copy</v-tab>
            <v-tab value="curriculum" class="text-none font-weight-bold">Modules & Audience</v-tab>
          </v-tabs>

          <v-form ref="form" v-model="valid">
            <v-window v-model="tab">
              <!-- TAB 1: BASIC METADATA -->
              <v-window-item value="basic">
                <v-row dense>
                  <v-col cols="12" md="7">
                    <v-text-field
                      v-model="editedItem.name"
                      label="Qualification Title *"
                      placeholder="e.g. ISO 22000:2018 Food Safety Management System"
                      variant="outlined"
                      density="comfortable"
                      :rules="[v => !!v || 'Title is required']"
                      @input="autoGenerateSlug"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-text-field
                      v-model="editedItem.slug"
                      label="URL Slug *"
                      placeholder="e.g. iso-22000"
                      variant="outlined"
                      density="comfortable"
                      hint="Public URL: /qualifications/:slug"
                      persistent-hint
                      :rules="[v => !!v || 'Slug is required']"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="editedItem.subtitle"
                      label="Subtitle / Tagline"
                      placeholder="e.g. International FSMS Auditor & Implementer Certification"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-select
                      v-model="editedItem.category"
                      :items="['Food Safety', 'Quality Management', 'Food Science', 'Regulatory Compliance']"
                      label="Category"
                      variant="outlined"
                      density="comfortable"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="editedItem.level"
                      :items="['Foundation', 'Intermediate', 'Advanced', 'Master Executive']"
                      label="Level"
                      variant="outlined"
                      density="comfortable"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="editedItem.badge_tag"
                      label="Badge Tag (e.g. GFSI Standard)"
                      placeholder="e.g. GFSI Benchmark"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="editedItem.duration"
                      label="Course Duration"
                      placeholder="e.g. 5 Days (40 Hours)"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="editedItem.assessment_type"
                      label="Assessment Type"
                      placeholder="e.g. Written Exam & Case Study"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="editedItem.validity"
                      label="Certificate Validity"
                      placeholder="e.g. 3 Years (Renewable)"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editedItem.icon_name"
                      label="MDI Icon Class"
                      placeholder="e.g. mdi-shield-check"
                      prepend-inner-icon="mdi-flower"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="editedItem.image_url"
                      label="Hero Image URL (Optional)"
                      placeholder="/uploads/branding/..."
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6" class="d-flex align-center">
                    <v-switch
                      v-model="editedItem.is_active"
                      color="success"
                      label="Published & Visible on Website"
                      hide-details
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- TAB 2: OVERVIEW & DESCRIPTIONS -->
              <v-window-item value="descriptions">
                <v-textarea
                  v-model="editedItem.short_description"
                  label="Short Card Description (1-2 sentences)"
                  variant="outlined"
                  rows="2"
                  auto-grow
                  class="mb-4"
                  hint="Displayed on the homepage and catalog grid cards"
                  persistent-hint
                ></v-textarea>

                <v-textarea
                  v-model="editedItem.full_description"
                  label="Full Overview & Course Introduction"
                  variant="outlined"
                  rows="8"
                  auto-grow
                  hint="Main content on the public qualification detail page"
                  persistent-hint
                ></v-textarea>
              </v-window-item>

              <!-- TAB 3: CURRICULUM & AUDIENCE -->
              <v-window-item value="curriculum">
                <!-- Key Modules -->
                <div class="mb-6">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <label class="font-weight-bold text-subtitle-2">Key Learning Modules</label>
                    <v-btn size="small" variant="tonal" color="red-darken-1" prepend-icon="mdi-plus" @click="addModule">Add Module</v-btn>
                  </div>
                  <div v-for="(mod, idx) in editedItem.key_modules" :key="idx" class="d-flex gap-2 mb-2 align-center">
                    <v-text-field
                      v-model="editedItem.key_modules[idx]"
                      placeholder="Module title (e.g. Module 1: Hazard Identification)"
                      variant="outlined"
                      density="compact"
                      hide-details
                    ></v-text-field>
                    <v-btn icon="mdi-close" variant="text" size="small" color="error" @click="removeModule(idx)"></v-btn>
                  </div>
                </div>

                <v-divider class="my-4"></v-divider>

                <!-- Who Should Attend -->
                <div class="mb-6">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <label class="font-weight-bold text-subtitle-2">Target Audience / Who Should Attend</label>
                    <v-btn size="small" variant="tonal" color="red-darken-1" prepend-icon="mdi-plus" @click="addAudience">Add Target Audience</v-btn>
                  </div>
                  <div v-for="(aud, idx) in editedItem.who_should_attend" :key="idx" class="d-flex gap-2 mb-2 align-center">
                    <v-text-field
                      v-model="editedItem.who_should_attend[idx]"
                      placeholder="Audience role (e.g. Food Safety Managers & Auditors)"
                      variant="outlined"
                      density="compact"
                      hide-details
                    ></v-text-field>
                    <v-btn icon="mdi-close" variant="text" size="small" color="error" @click="removeAudience(idx)"></v-btn>
                  </div>
                </div>

                <v-divider class="my-4"></v-divider>

                <!-- Key Benefits -->
                <div class="mb-6">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <label class="font-weight-bold text-subtitle-2">Key Career & Organizational Benefits</label>
                    <v-btn size="small" variant="tonal" color="red-darken-1" prepend-icon="mdi-plus" @click="addBenefit">Add Benefit</v-btn>
                  </div>
                  <div v-for="(ben, idx) in editedItem.benefits" :key="idx" class="d-flex gap-2 mb-2 align-center">
                    <v-text-field
                      v-model="editedItem.benefits[idx]"
                      placeholder="Benefit statement (e.g. Global recognition across 150+ countries)"
                      variant="outlined"
                      density="compact"
                      hide-details
                    ></v-text-field>
                    <v-btn icon="mdi-close" variant="text" size="small" color="error" @click="removeBenefit(idx)"></v-btn>
                  </div>
                </div>

                <v-divider class="my-4"></v-divider>

                <!-- Prerequisites -->
                <div>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <label class="font-weight-bold text-subtitle-2">Prerequisites</label>
                    <v-btn size="small" variant="tonal" color="red-darken-1" prepend-icon="mdi-plus" @click="addPrereq">Add Prerequisite</v-btn>
                  </div>
                  <div v-for="(pre, idx) in editedItem.prerequisites" :key="idx" class="d-flex gap-2 mb-2 align-center">
                    <v-text-field
                      v-model="editedItem.prerequisites[idx]"
                      placeholder="Prerequisite (e.g. Basic understanding of HACCP)"
                      variant="outlined"
                      density="compact"
                      hide-details
                    ></v-text-field>
                    <v-btn icon="mdi-close" variant="text" size="small" color="error" @click="removePrereq(idx)"></v-btn>
                  </div>
                </div>
              </v-window-item>
            </v-window>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-5 pt-3 bg-grey-lighten-5 border-top">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog" :disabled="saving">Cancel</v-btn>
          <v-btn color="red-darken-1" variant="flat" rounded="lg" class="px-6 font-weight-bold text-none" @click="saveItem" :loading="saving">
            {{ editedItem.id ? 'Update Qualification' : 'Save Qualification' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card class="rounded-xl pa-5 text-center">
        <v-icon color="error" size="64" class="mx-auto mb-3">mdi-alert-circle-outline</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Delete Qualification?</h3>
        <p class="text-body-2 text-grey-darken-1 mb-6">
          Are you sure you want to delete <strong>{{ itemToDelete?.name }}</strong>? This will remove it from the public catalog.
        </p>
        <div class="d-flex gap-3 justify-center">
          <v-btn variant="outlined" color="grey-darken-1" rounded="pill" class="px-6" @click="deleteDialog = false" :disabled="deleting">Cancel</v-btn>
          <v-btn color="error" variant="flat" rounded="pill" class="px-6" @click="deleteItem" :loading="deleting">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const qualifications = ref<any[]>([]);
const error = ref<string | null>(null);

const searchQuery = ref('');
const categoryFilter = ref('All Categories');
const tab = ref('basic');

const headers = [
  { title: 'Qualification & Tag', key: 'name', sortable: false },
  { title: 'Category & Level', key: 'category', sortable: false },
  { title: 'Duration & Validity', key: 'duration', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false, width: '100px' },
  { title: 'Order', key: 'order_index', sortable: false, width: '130px' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, width: '140px' }
];

const dialog = ref(false);
const deleteDialog = ref(false);
const valid = ref(false);
const form = ref();

const defaultItem = {
  id: null,
  slug: '',
  name: '',
  subtitle: '',
  short_description: '',
  full_description: '',
  category: 'Food Safety',
  level: 'Advanced',
  duration: '5 Days (40 Hours)',
  assessment_type: 'Online Examination',
  validity: 'Lifetime',
  prerequisites: [] as string[],
  key_modules: [] as string[],
  who_should_attend: [] as string[],
  benefits: [] as string[],
  badge_tag: '',
  image_url: '',
  icon_name: 'mdi-certificate',
  order_index: 0,
  is_active: true
};

const editedItem = ref({ ...defaultItem });
const itemToDelete = ref<any>(null);

const filteredQualifications = computed(() => {
  return qualifications.value.filter((q) => {
    const matchesSearch =
      !searchQuery.value ||
      q.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.slug.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.value.toLowerCase());

    const matchesCategory =
      categoryFilter.value === 'All Categories' || q.category === categoryFilter.value;

    return matchesSearch && matchesCategory;
  });
});

const fetchQualifications = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/admin/qualifications');
    qualifications.value = data;
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch qualifications';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchQualifications();
});

const autoGenerateSlug = () => {
  if (!editedItem.value.id && editedItem.value.name) {
    editedItem.value.slug = editedItem.value.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }
};

const addModule = () => editedItem.value.key_modules.push('');
const removeModule = (idx: number) => editedItem.value.key_modules.splice(idx, 1);

const addAudience = () => editedItem.value.who_should_attend.push('');
const removeAudience = (idx: number) => editedItem.value.who_should_attend.splice(idx, 1);

const addBenefit = () => editedItem.value.benefits.push('');
const removeBenefit = (idx: number) => editedItem.value.benefits.splice(idx, 1);

const addPrereq = () => editedItem.value.prerequisites.push('');
const removePrereq = (idx: number) => editedItem.value.prerequisites.splice(idx, 1);

const openDialog = (item?: any) => {
  tab.value = 'basic';
  if (item) {
    editedItem.value = {
      ...item,
      prerequisites: Array.isArray(item.prerequisites) ? [...item.prerequisites] : [],
      key_modules: Array.isArray(item.key_modules) ? [...item.key_modules] : [],
      who_should_attend: Array.isArray(item.who_should_attend) ? [...item.who_should_attend] : [],
      benefits: Array.isArray(item.benefits) ? [...item.benefits] : []
    };
  } else {
    editedItem.value = {
      ...defaultItem,
      prerequisites: [],
      key_modules: [],
      who_should_attend: [],
      benefits: [],
      order_index: qualifications.value.length
    };
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  setTimeout(() => {
    editedItem.value = { ...defaultItem };
    if (form.value) form.value.resetValidation();
  }, 300);
};

const saveItem = async () => {
  const { valid: isValid } = await form.value.validate();
  if (!isValid) return;

  saving.value = true;
  error.value = null;

  // Clean empty strings from arrays
  const payload = {
    ...editedItem.value,
    key_modules: editedItem.value.key_modules.filter(s => s && s.trim()),
    who_should_attend: editedItem.value.who_should_attend.filter(s => s && s.trim()),
    benefits: editedItem.value.benefits.filter(s => s && s.trim()),
    prerequisites: editedItem.value.prerequisites.filter(s => s && s.trim())
  };

  try {
    if (editedItem.value.id) {
      await api.put(`/admin/qualifications/${editedItem.value.id}`, payload);
    } else {
      await api.post('/admin/qualifications', payload);
    }
    await fetchQualifications();
    closeDialog();
  } catch (err: any) {
    error.value = err.message || 'Failed to save qualification';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item: any) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const deleteItem = async () => {
  if (!itemToDelete.value) return;
  deleting.value = true;
  try {
    await api.delete(`/admin/qualifications/${itemToDelete.value.id}`);
    await fetchQualifications();
    deleteDialog.value = false;
  } catch (err: any) {
    error.value = err.message || 'Failed to delete qualification';
  } finally {
    deleting.value = false;
  }
};

const toggleActive = async (item: any) => {
  try {
    await api.patch(`/admin/qualifications/${item.id}/toggle-active`);
  } catch (err) {
    console.error(err);
    fetchQualifications();
  }
};

const moveUp = (index: number) => {
  if (index === 0) return;
  const temp = qualifications.value[index];
  qualifications.value[index] = qualifications.value[index - 1];
  qualifications.value[index - 1] = temp;
  updateOrder();
};

const moveDown = (index: number) => {
  if (index === qualifications.value.length - 1) return;
  const temp = qualifications.value[index];
  qualifications.value[index] = qualifications.value[index + 1];
  qualifications.value[index + 1] = temp;
  updateOrder();
};

const updateOrder = async () => {
  for (let i = 0; i < qualifications.value.length; i++) {
    qualifications.value[i].order_index = i;
    try {
      await api.put(`/admin/qualifications/${qualifications.value[i].id}`, qualifications.value[i]);
    } catch (e) {
      console.error(e);
    }
  }
};
</script>

<style scoped>
.border-surface {
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
}
.border-bottom {
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}
.border-top {
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}
</style>
