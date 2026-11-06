<template>
  <div class="gsfin-admin-page">
    <div class="admin-wrap">

      <!-- ═══ HEADER ROW ═══ -->
      <div class="admin-header-row">
        <div>
          <h1 class="admin-title">Inquiries</h1>
        </div>

        <div class="header-actions">
          <button class="btn-glass" @click="fetchInquiries">
            <i class="mdi mdi-refresh"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state-box">
        <span class="spinner-sm-red"></span>
        <p class="loading-text">Loading inquiries...</p>
      </div>

      <div v-else>
        <!-- ═══ FILTERING & TABLE ═══ -->
        <div class="panel-card pa-6">
          <div class="table-controls mb-6">
            <div class="tab-pill-group">
              <button 
                class="pill-tab-btn" 
                :class="{ 'active': activeTab === 'all' }"
                @click="activeTab = 'all'"
              >
                All ({{ inquiries.length }})
              </button>
              <button 
                class="pill-tab-btn" 
                :class="{ 'active': activeTab === 'partner' }"
                @click="activeTab = 'partner'"
              >
                <i class="mdi mdi-office-building mr-1"></i> Partner Applications ({{ partnerCount }})
              </button>
              <button 
                class="pill-tab-btn" 
                :class="{ 'active': activeTab === 'general' }"
                @click="activeTab = 'general'"
              >
                <i class="mdi mdi-message-text-outline mr-1"></i> General Inquiries ({{ generalCount }})
              </button>
            </div>

            <div class="search-filter-wrap">
              <div class="search-box">
                <i class="mdi mdi-magnify search-icon"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by name, organization, or email..." class="search-input" />
              </div>

              <select v-model="statusFilter" class="filter-select">
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="gsfin-table">
              <!-- DYNAMIC TABLE HEADERS PER TAB -->
              <thead v-if="activeTab === 'partner'">
                <tr>
                  <th class="th-inst">Organization</th>
                  <th class="th-contact">Contact Person</th>
                  <th class="th-info">Email &amp; Phone</th>
                  <th class="th-loc">Location</th>
                  <th class="th-date">Date</th>
                  <th class="th-status">Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>

              <thead v-else-if="activeTab === 'general'">
                <tr>
                  <th class="th-inst">Subject</th>
                  <th class="th-contact">Contact Person</th>
                  <th class="th-info">Email &amp; Phone</th>
                  <th class="th-loc">Location</th>
                  <th class="th-date">Date</th>
                  <th class="th-status">Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>

              <thead v-else>
                <tr>
                  <th class="th-inst">Organization / Subject</th>
                  <th class="th-contact">Contact Person</th>
                  <th class="th-info">Email &amp; Phone</th>
                  <th class="th-loc">Location</th>
                  <th class="th-date">Date</th>
                  <th class="th-status">Status</th>
                  <th class="th-actions">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="filteredInquiries.length === 0">
                  <td colspan="7" class="empty-state-cell">
                    <i class="mdi mdi-email-open-outline empty-state-icon"></i>
                    <p class="empty-state-text">No inquiries or partner applications match your criteria.</p>
                  </td>
                </tr>

                <tr v-for="item in paginatedInquiries" :key="item.id" :class="{ 'unread-row': item.status === 'new' }">
                  <!-- Col 1: Applicant / Institution / Subject -->
                  <td>
                    <div class="col-inst-wrap">
                      <div class="submission-type-wrap">
                        <span v-if="isPartnerApp(item.subject)" class="type-tag tag-partner">
                          <i class="mdi mdi-office-building"></i> Partner Application
                        </span>
                        <span v-else class="type-tag tag-general">
                          <i class="mdi mdi-message-text-outline"></i> General Inquiry
                        </span>
                      </div>
                      
                      <div class="inst-primary-name">
                        <i v-if="isPartnerApp(item.subject)" class="mdi mdi-domain text-emerald"></i>
                        <i v-else class="mdi mdi-help-circle-outline text-indigo"></i>
                        <span>{{ isPartnerApp(item.subject) ? parsePartnerDetails(item).institution : (item.subject || 'General Inquiry') }}</span>
                      </div>

                      <!-- Programs Requested (if partner application) -->
                      <div v-if="isPartnerApp(item.subject) && parsePartnerDetails(item).programs.length > 0" class="partner-programs-wrap">
                        <span v-for="p in parsePartnerDetails(item).programs" :key="p" class="program-tag-sm">
                          <i class="mdi mdi-check-circle-outline"></i> {{ p }}
                        </span>
                      </div>
                      <div v-else-if="!isPartnerApp(item.subject) && item.message" class="inquiry-msg-snippet">
                        {{ item.message.slice(0, 50) }}{{ item.message.length > 50 ? '...' : '' }}
                      </div>
                    </div>
                  </td>

                  <!-- Col 2: Contact Person -->
                  <td>
                    <div class="col-contact-person">
                      <div class="contact-person-name">
                        <i class="mdi mdi-account-circle-outline text-indigo mr-1"></i>
                        <span>{{ item.name }}</span>
                      </div>
                      <div class="contact-person-role">
                        {{ isPartnerApp(item.subject) ? (parsePartnerDetails(item).institutionType || 'Training Center') : 'Individual Sender' }}
                      </div>
                    </div>
                  </td>

                  <!-- Col 3: Contact Info (Email & Phone) -->
                  <td>
                    <div class="col-contact-info">
                      <a :href="`mailto:${item.email}`" class="contact-email-link" title="Click to send email">
                        <i class="mdi mdi-email-outline contact-icon"></i>
                        <span>{{ item.email }}</span>
                      </a>
                      <div v-if="item.phone" class="contact-phone-row">
                        <i class="mdi mdi-phone-outline contact-icon"></i>
                        <span>{{ item.phone }}</span>
                      </div>
                      <div v-else class="contact-phone-row text-muted">
                        <i class="mdi mdi-phone-off-outline contact-icon"></i>
                        <span>No phone</span>
                      </div>
                    </div>
                  </td>

                  <!-- Col 4: Location / Region -->
                  <td>
                    <div v-if="isPartnerApp(item.subject) && (parsePartnerDetails(item).country || parsePartnerDetails(item).city)" class="location-badge">
                      <i class="mdi mdi-earth"></i>
                      <span>{{ parsePartnerDetails(item).country }}<template v-if="parsePartnerDetails(item).city"> · {{ parsePartnerDetails(item).city }}</template></span>
                    </div>
                    <div v-else class="location-cell text-muted">
                      <i class="mdi mdi-web"></i>
                      <span>Global</span>
                    </div>
                  </td>

                  <!-- Col 5: Date Received -->
                  <td>
                    <div class="date-cell">
                      <span class="date-main">{{ formatDateDay(item.submitted_at) }}</span>
                      <span class="date-time">{{ formatDateTime(item.submitted_at) }}</span>
                    </div>
                  </td>

                  <!-- Col 6: Status -->
                  <td>
                    <button class="status-btn" :class="getStatusClass(item.status)" @click="toggleStatus(item)" title="Click to toggle status">
                      <span class="status-dot"></span>
                      {{ item.status.toUpperCase() }}
                    </button>
                  </td>

                  <!-- Col 7: Actions -->
                  <td>
                    <div class="actions-cell">
                      <button class="btn-table-action btn-view" title="View" @click="openViewModal(item)">
                        <i class="mdi mdi-eye-outline"></i>
                      </button>
                      <button class="btn-table-action btn-edit" title="Edit" @click="openEditModal(item)">
                        <i class="mdi mdi-pencil-outline"></i>
                      </button>
                      <button class="btn-table-action btn-convert" title="Convert to Partner" @click="openConvertModal(item)">
                        <i class="mdi mdi-handshake-outline"></i>
                      </button>
                      <button class="btn-table-action btn-danger" title="Delete" @click="confirmDelete(item)">
                        <i class="mdi mdi-trash-can-outline"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <AppPagination
              v-if="filteredInquiries.length > 0"
              v-model="page"
              v-model:items-per-page="perPage"
              :total-items="filteredInquiries.length"
              :per-page-options="[10, 25, 50, 100]"
            />
          </div>
        </div>

      </div>

    </div>

    <!-- ═══ INQUIRY & PARTNER APPLICATION DETAIL MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="detailModalOpen" class="modal-overlay" @click.self="detailModalOpen = false">
          <div class="modal-card">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-left">
                <div :class="['icon-box-lg', isPartnerApp(selectedItem?.subject) ? 'bg-emerald-light text-emerald' : 'bg-indigo-light text-indigo']">
                  <i :class="['mdi', isPartnerApp(selectedItem?.subject) ? 'mdi-office-building' : 'mdi-email-outline']"></i>
                </div>
                <div>
                  <h3 class="modal-title">
                    {{ isPartnerApp(selectedItem?.subject) ? 'Partner Application' : 'General Inquiry' }}
                  </h3>
                  <span class="modal-date-sub">Received {{ formatDate(selectedItem?.submitted_at) }}</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="detailModalOpen = false"><i class="mdi mdi-close"></i></button>
            </div>

            <div class="modal-body">
              
              <!-- IF PARTNER APPLICATION -->
              <div v-if="isPartnerApp(selectedItem?.subject)" class="modal-stack">
                <div class="sender-info-box">
                  <div class="modal-grid-2">
                    <div>
                      <span class="detail-label">Organization Name:</span>
                      <span class="detail-val institution-title">{{ parsePartnerDetails(selectedItem).institution }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Country &amp; City:</span>
                      <span class="detail-val">
                        {{ parsePartnerDetails(selectedItem).country }}
                        <template v-if="parsePartnerDetails(selectedItem).city">
                          · {{ parsePartnerDetails(selectedItem).city }}
                        </template>
                      </span>
                    </div>
                    <div>
                      <span class="detail-label">Contact Person:</span>
                      <span class="detail-val">{{ selectedItem?.name }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Organization Type:</span>
                      <span class="detail-val">{{ parsePartnerDetails(selectedItem).institutionType }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Status:</span>
                      <div>
                        <button 
                          type="button"
                          class="status-btn" 
                          :class="getStatusClass(selectedItem?.status)" 
                          @click="toggleStatus(selectedItem)" 
                          title="Click to toggle status: New → Read → Replied"
                        >
                          <span class="status-dot"></span>
                          {{ selectedItem?.status ? selectedItem.status.toUpperCase() : '' }}
                          <i class="mdi mdi-swap-horizontal status-toggle-hint"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="modal-grid-2">
                  <div class="info-card-sm">
                    <span class="detail-label">Email Address:</span>
                    <a :href="`mailto:${selectedItem?.email}`" class="detail-val detail-email-link hover-underline">{{ selectedItem?.email }}</a>
                  </div>
                  <div class="info-card-sm">
                    <span class="detail-label">Phone Number:</span>
                    <span class="detail-val">{{ selectedItem?.phone || 'Not provided' }}</span>
                  </div>
                </div>

                <!-- PROGRAMS REQUESTED -->
                <div v-if="parsePartnerDetails(selectedItem).programs.length > 0">
                  <span class="detail-label detail-label-block">Programs:</span>
                  <div class="modal-programs-list">
                    <span v-for="prog in parsePartnerDetails(selectedItem).programs" :key="prog" class="modal-program-badge">
                      <i class="mdi mdi-check-decagram text-emerald"></i>
                      <span>{{ prog }}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <span class="detail-label detail-label-block">Message &amp; Notes:</span>
                  <div class="message-content-box">{{ parsePartnerDetails(selectedItem).notes }}</div>
                </div>
              </div>

              <!-- IF GENERAL INQUIRY -->
              <div v-else class="modal-stack">
                <div class="sender-info-box">
                  <div class="modal-grid-2">
                    <div>
                      <span class="detail-label">Contact Person:</span>
                      <span class="detail-val">{{ selectedItem?.name }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Email Address:</span>
                      <a :href="`mailto:${selectedItem?.email}`" class="detail-val detail-email-link hover-underline">{{ selectedItem?.email }}</a>
                    </div>
                    <div>
                      <span class="detail-label">Phone Number:</span>
                      <span class="detail-val">{{ selectedItem?.phone || 'Not provided' }}</span>
                    </div>
                    <div>
                      <span class="detail-label">Status:</span>
                      <div>
                        <button 
                          type="button"
                          class="status-btn" 
                          :class="getStatusClass(selectedItem?.status)" 
                          @click="toggleStatus(selectedItem)" 
                          title="Click to toggle status: New → Read → Replied"
                        >
                          <span class="status-dot"></span>
                          {{ selectedItem?.status ? selectedItem.status.toUpperCase() : '' }}
                          <i class="mdi mdi-swap-horizontal status-toggle-hint"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span class="detail-label detail-label-block">Subject:</span>
                  <div class="subject-box">{{ selectedItem?.subject }}</div>
                </div>

                <div>
                  <span class="detail-label detail-label-block">Message:</span>
                  <div class="message-content-box">{{ selectedItem?.message }}</div>
                </div>
              </div>

            </div>

            <div class="modal-footer">
              <button class="btn-glass" @click="detailModalOpen = false">
                <i class="mdi mdi-close"></i> Close
              </button>

              <div class="modal-footer-actions">
                <button class="btn-indigo" @click="openEditModal(selectedItem); detailModalOpen = false;">
                  <i class="mdi mdi-pencil-outline"></i> Edit Lead
                </button>
                <button v-if="isPartnerApp(selectedItem?.subject)" class="btn-emerald" @click="openConvertModal(selectedItem); detailModalOpen = false;">
                  <i class="mdi mdi-handshake-outline"></i> Convert to Partner
                </button>
                <a :href="`mailto:${selectedItem?.email}?subject=Re: ${encodeURIComponent(selectedItem?.subject || 'Inquiry')}`" class="btn-red text-decoration-none">
                  <i class="mdi mdi-reply"></i> Send Email
                </a>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ EDIT LEAD & STATUS MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="editModalOpen" class="modal-overlay" @click.self="editModalOpen = false">
          <div class="modal-card modal-card-lg">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="icon-box-lg bg-indigo-light text-indigo">
                  <i class="mdi mdi-lead-pencil"></i>
                </div>
                <div>
                  <h3 class="modal-title">Edit Lead</h3>
                  <span class="modal-date-sub">Update contact details and status</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="editModalOpen = false"><i class="mdi mdi-close"></i></button>
            </div>

            <!-- Modal Body Form -->
            <form @submit.prevent="saveEditSubmission" class="modal-form-wrap">
              <div class="modal-body">
                <div class="modal-stack">

                  <!-- 1. OPTION TO CHANGE STATUS OF LEAD VIA EDIT -->
                  <div class="form-section-card">
                    <div class="section-card-header">
                      <span class="form-label-bold">
                        <i class="mdi mdi-flag-checkered mr-1"></i> Status
                      </span>
                      <span class="section-sub-tip">Select lead status</span>
                    </div>

                    <div class="status-options-grid">
                      <button 
                        type="button" 
                        class="status-radio-pill pill-new" 
                        :class="{ 'selected': editForm.status === 'new' }"
                        @click="editForm.status = 'new'"
                      >
                        <span class="status-dot-sm bg-red"></span>
                        <div class="status-pill-text">
                          <span class="status-pill-title">New</span>
                          <span class="status-pill-sub">Not reviewed</span>
                        </div>
                      </button>

                      <button 
                        type="button" 
                        class="status-radio-pill pill-read" 
                        :class="{ 'selected': editForm.status === 'read' }"
                        @click="editForm.status = 'read'"
                      >
                        <span class="status-dot-sm bg-slate"></span>
                        <div class="status-pill-text">
                          <span class="status-pill-title">Read</span>
                          <span class="status-pill-sub">In review</span>
                        </div>
                      </button>

                      <button 
                        type="button" 
                        class="status-radio-pill pill-replied" 
                        :class="{ 'selected': editForm.status === 'replied' }"
                        @click="editForm.status = 'replied'"
                      >
                        <span class="status-dot-sm bg-emerald"></span>
                        <div class="status-pill-text">
                          <span class="status-pill-title">Replied</span>
                          <span class="status-pill-sub">Contacted</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- 2. CONTACT DETAILS -->
                  <div class="form-grid-2">
                    <div class="form-group">
                      <label class="form-label">Contact Person <span class="required-asterisk">*</span></label>
                      <input 
                        v-model="editForm.name" 
                        type="text" 
                        required 
                        class="form-input" 
                        placeholder="e.g. Dr. Sarah Jenkins"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Email Address <span class="required-asterisk">*</span></label>
                      <input 
                        v-model="editForm.email" 
                        type="email" 
                        required 
                        class="form-input" 
                        placeholder="sarah@institution.org"
                      />
                    </div>
                  </div>

                  <div class="form-grid-2">
                    <div class="form-group">
                      <label class="form-label">Phone Number</label>
                      <input 
                        v-model="editForm.phone" 
                        type="text" 
                        class="form-input" 
                        placeholder="+44 7911 123456"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Subject</label>
                      <input 
                        v-model="editForm.subject" 
                        type="text" 
                        class="form-input" 
                        placeholder="e.g. Partner Application"
                      />
                    </div>
                  </div>

                  <!-- 3. ORGANIZATION DETAILS (If Partner App) -->
                  <div v-if="editForm.isPartner" class="form-section-card">
                    <div class="section-card-header">
                      <span class="form-label-bold">
                        <i class="mdi mdi-office-building mr-1"></i> Organization Details
                      </span>
                    </div>

                    <div class="form-grid-2 mb-3">
                      <div class="form-group">
                        <label class="form-label">Organization Name</label>
                        <input 
                          v-model="editForm.institution" 
                          type="text" 
                          class="form-input" 
                          placeholder="e.g. Royal Food Safety Academy"
                        />
                      </div>

                      <div class="form-group">
                        <label class="form-label">Organization Type</label>
                        <select v-model="editForm.institutionType" class="form-select">
                          <option value="Authorized Training Center">Authorized Training Center</option>
                          <option value="University / Academic Institution">University / Academic Institution</option>
                          <option value="Corporate Enterprise">Corporate Enterprise</option>
                          <option value="Testing &amp; Inspection Body">Testing &amp; Inspection Body</option>
                          <option value="Government / Regulatory Agency">Government / Regulatory Agency</option>
                        </select>
                      </div>
                    </div>

                    <div class="form-grid-2 mb-3">
                      <div class="form-group">
                        <label class="form-label">Country</label>
                        <input 
                          v-model="editForm.country" 
                          type="text" 
                          class="form-input" 
                          placeholder="e.g. United Kingdom"
                        />
                      </div>

                      <div class="form-group">
                        <label class="form-label">City</label>
                        <input 
                          v-model="editForm.city" 
                          type="text" 
                          class="form-input" 
                          placeholder="e.g. London"
                        />
                      </div>
                    </div>

                    <!-- Programs Toggle -->
                    <div class="form-group">
                      <label class="form-label mb-2">Programs</label>
                      <div class="programs-toggle-list">
                        <button 
                          v-for="prog in availablePrograms" 
                          :key="prog" 
                          type="button" 
                          class="program-chip-toggle" 
                          :class="{ 'active': editForm.programs.includes(prog) }"
                          @click="toggleEditProgram(prog)"
                        >
                          <i :class="['mdi', editForm.programs.includes(prog) ? 'mdi-checkbox-marked-circle' : 'mdi-plus-circle-outline']"></i>
                          {{ prog }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- 4. NOTES / MESSAGE -->
                  <div class="form-group">
                    <label class="form-label">Message &amp; Notes</label>
                    <textarea 
                      v-model="editForm.notes" 
                      rows="3" 
                      class="form-textarea" 
                      placeholder="Enter notes or message..."
                    ></textarea>
                  </div>

                </div>
              </div>

              <!-- Modal Footer -->
              <div class="modal-footer">
                <button type="button" class="btn-glass" @click="editModalOpen = false">Cancel</button>
                <button type="submit" class="btn-red" :disabled="savingEdit">
                  <span v-if="savingEdit" class="spinner-sm-white mr-1"></span>
                  <i v-else class="mdi mdi-check mr-1"></i>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ CONVERT AS A PARTNER MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="convertModalOpen" class="modal-overlay" @click.self="convertModalOpen = false">
          <div class="modal-card modal-card-lg">
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="icon-box-lg bg-emerald-light text-emerald">
                  <i class="mdi mdi-handshake"></i>
                </div>
                <div>
                  <h3 class="modal-title">Convert to Partner</h3>
                  <span class="modal-date-sub">Add this organization to your partner list</span>
                </div>
              </div>
              <button class="modal-close-btn" @click="convertModalOpen = false"><i class="mdi mdi-close"></i></button>
            </div>

            <!-- Modal Body Form -->
            <form @submit.prevent="executeConvertToPartner" class="modal-form-wrap">
              <div class="modal-body">
                <div class="modal-stack">

                  <!-- Simple Info Banner -->
                  <div class="convert-banner mb-3">
                    <i class="mdi mdi-information-outline"></i>
                    <span>This will create a partner account and mark this lead as Replied.</span>
                  </div>

                  <!-- Partner Details Form -->
                  <div class="form-grid-2">
                    <div class="form-group">
                      <label class="form-label">Organization Name <span class="required-asterisk">*</span></label>
                      <input 
                        v-model="convertForm.name" 
                        type="text" 
                        required 
                        class="form-input" 
                        placeholder="e.g. Royal Food Safety Academy"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Organization Type</label>
                      <select v-model="convertForm.institution_type" class="form-select">
                        <option value="Authorized Training Center">Authorized Training Center</option>
                        <option value="University / Academic Institution">University / Academic Institution</option>
                        <option value="Corporate Enterprise">Corporate Enterprise</option>
                        <option value="Testing &amp; Inspection Body">Testing &amp; Inspection Body</option>
                        <option value="Government / Regulatory Agency">Government / Regulatory Agency</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-grid-2">
                    <div class="form-group">
                      <label class="form-label">Contact Person</label>
                      <input 
                        v-model="convertForm.contact_person" 
                        type="text" 
                        class="form-input" 
                        placeholder="e.g. Dr. Sarah Jenkins"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Email Address <span class="required-asterisk">*</span></label>
                      <input 
                        v-model="convertForm.contact_email" 
                        type="email" 
                        required 
                        class="form-input" 
                        placeholder="sarah@royalfoodsafety.co.uk"
                      />
                    </div>
                  </div>

                  <div class="form-grid-2">
                    <div class="form-group">
                      <label class="form-label">Phone Number</label>
                      <input 
                        v-model="convertForm.contact_phone" 
                        type="text" 
                        class="form-input" 
                        placeholder="+44 7911 123456"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Country &amp; City</label>
                      <div class="dual-input-row">
                        <input 
                          v-model="convertForm.country" 
                          type="text" 
                          class="form-input" 
                          placeholder="Country"
                        />
                        <input 
                          v-model="convertForm.city" 
                          type="text" 
                          class="form-input" 
                          placeholder="City"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Programs -->
                  <div class="form-group">
                    <label class="form-label mb-2">Programs</label>
                    <div class="programs-toggle-list">
                      <button 
                        v-for="prog in availablePrograms" 
                        :key="prog" 
                        type="button" 
                        class="program-chip-toggle emerald-toggle" 
                        :class="{ 'active': convertForm.programs.includes(prog) }"
                        @click="toggleConvertProgram(prog)"
                      >
                        <i :class="['mdi', convertForm.programs.includes(prog) ? 'mdi-check-decagram' : 'mdi-plus-circle-outline']"></i>
                        {{ prog }}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Modal Footer -->
              <div class="modal-footer">
                <button type="button" class="btn-glass" @click="convertModalOpen = false">Cancel</button>
                <button type="submit" class="btn-emerald" :disabled="convertingPartner">
                  <span v-if="convertingPartner" class="spinner-sm-white mr-1"></span>
                  <i v-else class="mdi mdi-check mr-1"></i>
                  Convert to Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ═══ CONVERT SUCCESS MODAL ═══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="convertSuccessModalOpen" class="modal-overlay" @click.self="convertSuccessModalOpen = false">
          <div class="modal-card modal-card-sm text-center">
            <div class="modal-body py-8 px-6 text-center">
              <div class="success-icon-wrap mb-4">
                <i class="mdi mdi-check-circle"></i>
              </div>
              <h3 class="success-title mb-2">Partner Added Successfully</h3>
              <p class="success-desc mb-6">
                <strong>{{ convertedOrgName }}</strong> has been added to your partner list.
              </p>
              <div class="success-actions-row">
                <button class="btn-glass" @click="convertSuccessModalOpen = false">Close</button>
                <button class="btn-emerald" @click="goToPartnerDirectory">
                  <i class="mdi mdi-office-building mr-1"></i> View Partners
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import dayjs from 'dayjs';
import AppPagination from '@/components/common/AppPagination.vue';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  roles: ['super_admin', 'main_admin', 'sub_admin']
});

const router = useRouter();
const api = useApi();
const loading = ref(true);
const inquiries = ref<any[]>([]);

const activeTab = ref<'all' | 'partner' | 'general'>('all');
const searchQuery = ref('');
const statusFilter = ref('all');

const detailModalOpen = ref(false);
const selectedItem = ref<any>(null);

// Edit Modal State
const editModalOpen = ref(false);
const savingEdit = ref(false);
const editForm = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  subject: '',
  status: 'read',
  isPartner: false,
  institution: '',
  country: '',
  city: '',
  institutionType: 'Authorized Training Center',
  programs: [] as string[],
  notes: ''
});

// Convert to Partner Modal State
const convertModalOpen = ref(false);
const convertingPartner = ref(false);
const convertSuccessModalOpen = ref(false);
const convertedOrgName = ref('');
const convertForm = ref({
  inquiryId: '',
  name: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  country: '',
  city: '',
  institution_type: 'Authorized Training Center',
  programs: [] as string[]
});

const availablePrograms = [
  'CODEX HACCP',
  'ISO 22000',
  'FSSC 22000',
  'BRCGS',
  'IFS Food',
  'GMP & GHP'
];

const isPartnerApp = (subject: string) => {
  if (!subject) return false;
  const s = subject.toLowerCase();
  return s.includes('partner') || s.includes('accreditation') || s.includes('institution');
};

const parsePartnerDetails = (item: any) => {
  if (!item) {
    return {
      institution: 'Institution',
      country: 'Global Jurisdiction',
      city: '',
      programs: [] as string[],
      institutionType: 'Accredited Center',
      notes: ''
    };
  }

  const msg = item.message || '';
  let institution = '';
  let country = '';
  let city = '';
  let programs: string[] = [];
  let institutionType = '';
  let notes = msg;

  const instMatch = msg.match(/(?:Organization Name|Institution|Training Center):\s*([^\n\r]+)/i);
  if (instMatch) institution = instMatch[1].trim();

  const countryMatch = msg.match(/Country:\s*([^\n\r]+)/i);
  if (countryMatch) country = countryMatch[1].trim();

  const cityMatch = msg.match(/City:\s*([^\n\r]+)/i);
  if (cityMatch) city = cityMatch[1].trim();

  const progMatch = msg.match(/(?:Accreditation Programs|Programs|Certifications):\s*([^\n\r]+)/i);
  if (progMatch) {
    const rawProgs = progMatch[1].trim();
    if (rawProgs && !['n/a', 'none', 'not provided', 'null'].includes(rawProgs.toLowerCase())) {
      programs = rawProgs.split(',').map((p: string) => p.trim()).filter(Boolean);
    }
  }

  const typeMatch = msg.match(/Institution Type:\s*([^\n\r]+)/i);
  if (typeMatch) institutionType = typeMatch[1].trim();

  const notesMatch = msg.match(/(?:Notes|Additional Message|Applicant Notes):\s*([\s\S]+)/i);
  if (notesMatch) notes = notesMatch[1].trim();

  // Parse from subject if institution, country, or city not in message
  if (item.subject) {
    // E.g. "Training Center Accreditation: Royal Food Safety Academy (United Kingdom - London)"
    const subjectMatch = item.subject.match(/:\s*([^()]+)(?:\s*\(([^)]+)\))?/i);
    if (subjectMatch) {
      if (!institution && subjectMatch[1]) institution = subjectMatch[1].trim();
      if (subjectMatch[2]) {
        const parts = subjectMatch[2].split('-');
        if (!country && parts[0]) country = parts[0].trim();
        if (!city && parts.length > 1) city = parts[1].trim();
      }
    } else if (!institution) {
      const parts = item.subject.split('-');
      if (parts.length > 1) institution = parts[parts.length - 1].trim();
    }
  }

  return {
    institution: institution || item.name || 'Training Center',
    country: country || 'Global Jurisdiction',
    city: city || '',
    programs: programs,
    institutionType: institutionType || 'Accredited Center',
    notes: notes || msg
  };
};

const partnerCount = computed(() => inquiries.value.filter(i => isPartnerApp(i.subject)).length);
const generalCount = computed(() => inquiries.value.filter(i => !isPartnerApp(i.subject)).length);
const unreadCount = computed(() => inquiries.value.filter(i => i.status === 'new').length);

const filteredInquiries = computed(() => {
  return inquiries.value.filter(item => {
    // Tab filter
    if (activeTab.value === 'partner' && !isPartnerApp(item.subject)) return false;
    if (activeTab.value === 'general' && isPartnerApp(item.subject)) return false;

    // Status filter
    if (statusFilter.value !== 'all' && item.status !== statusFilter.value) return false;

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = item.name && item.name.toLowerCase().includes(q);
      const matchEmail = item.email && item.email.toLowerCase().includes(q);
      const matchSubject = item.subject && item.subject.toLowerCase().includes(q);
      const matchMsg = item.message && item.message.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchSubject && !matchMsg) return false;
    }

    return true;
  });
});

const page = ref(1);
const perPage = ref(10);

const paginatedInquiries = computed(() => {
  const start = (page.value - 1) * perPage.value;
  return filteredInquiries.value.slice(start, start + perPage.value);
});

watch([activeTab, searchQuery, statusFilter], () => {
  page.value = 1;
});

const fetchInquiries = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/inquiries');
    inquiries.value = res.data || res || [];
  } catch (err) {
    console.error('Failed to fetch inquiries:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return dayjs(dateStr).format('MMM DD, YYYY · h:mm A');
};

const formatDateDay = (dateStr: string) => {
  if (!dateStr) return '—';
  return dayjs(dateStr).format('MMM D, YYYY');
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('h:mm A');
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'new': return 'status-new';
    case 'read': return 'status-read';
    case 'replied': return 'status-replied';
    default: return 'status-read';
  }
};

const toggleStatus = async (item: any) => {
  const nextStatus = item.status === 'new' ? 'read' : item.status === 'read' ? 'replied' : 'new';
  await updateStatus(item, nextStatus);
};

const updateStatus = async (item: any, newStatus: string) => {
  try {
    await api.patch(`/admin/inquiries/${item.id}/status`, { status: newStatus });
    item.status = newStatus;
  } catch (err) {
    console.error('Failed to update status:', err);
  }
};

const openViewModal = (item: any) => {
  selectedItem.value = item;
  detailModalOpen.value = true;
  if (item.status === 'new') {
    updateStatus(item, 'read');
  }
};

const openEditModal = (item: any) => {
  const details = parsePartnerDetails(item);
  const isPart = isPartnerApp(item.subject);
  editForm.value = {
    id: item.id,
    name: item.name || '',
    email: item.email || '',
    phone: item.phone || '',
    subject: item.subject || (isPart ? 'Partner Application' : 'General Inquiry'),
    status: item.status || 'read',
    isPartner: isPart,
    institution: details.institution && details.institution !== 'Institution' ? details.institution : (isPart ? item.name : ''),
    country: details.country && details.country !== 'Global Jurisdiction' ? details.country : '',
    city: details.city || '',
    institutionType: details.institutionType || 'Authorized Training Center',
    programs: details.programs && details.programs.length > 0 ? [...details.programs] : (isPart ? ['CODEX HACCP', 'ISO 22000'] : []),
    notes: details.notes || item.message || ''
  };
  editModalOpen.value = true;
};

const toggleEditProgram = (prog: string) => {
  const idx = editForm.value.programs.indexOf(prog);
  if (idx >= 0) {
    editForm.value.programs.splice(idx, 1);
  } else {
    editForm.value.programs.push(prog);
  }
};

const toggleConvertProgram = (prog: string) => {
  const idx = convertForm.value.programs.indexOf(prog);
  if (idx >= 0) {
    convertForm.value.programs.splice(idx, 1);
  } else {
    convertForm.value.programs.push(prog);
  }
};

const saveEditSubmission = async () => {
  if (!editForm.value.name?.trim() || !editForm.value.email?.trim()) {
    alert('Contact Person Name and Email Address are required.');
    return;
  }
  savingEdit.value = true;
  try {
    let finalMessage = editForm.value.notes?.trim() || '';
    if (editForm.value.isPartner) {
      finalMessage = `Organization Name: ${editForm.value.institution?.trim() || editForm.value.name}\n` +
        `Contact Person: ${editForm.value.name}\n` +
        `Institution Type: ${editForm.value.institutionType}\n` +
        `Country: ${editForm.value.country?.trim() || 'Global Jurisdiction'}\n` +
        `City: ${editForm.value.city?.trim() || ''}\n` +
        `Accreditation Programs: ${editForm.value.programs.join(', ')}\n` +
        `Notes: ${editForm.value.notes?.trim() || 'Accreditation application submitted.'}`;
    }

    const payload = {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
      phone: editForm.value.phone?.trim() || null,
      subject: editForm.value.subject?.trim() || (editForm.value.isPartner ? 'Partner Application' : 'General Inquiry'),
      message: finalMessage,
      status: editForm.value.status
    };

    await api.put(`/admin/inquiries/${editForm.value.id}`, payload);

    // Update in local list
    const idx = inquiries.value.findIndex(i => i.id === editForm.value.id);
    if (idx !== -1) {
      inquiries.value[idx] = {
        ...inquiries.value[idx],
        ...payload
      };
      if (selectedItem.value && selectedItem.value.id === editForm.value.id) {
        selectedItem.value = { ...inquiries.value[idx] };
      }
    }

    editModalOpen.value = false;
  } catch (err: any) {
    console.error('Failed to update submission:', err);
    alert(err?.response?.data?.error || err?.message || 'Failed to update submission.');
  } finally {
    savingEdit.value = false;
  }
};

const openConvertModal = (item: any) => {
  const details = parsePartnerDetails(item);
  convertForm.value = {
    inquiryId: item.id,
    name: details.institution && details.institution !== 'Institution' ? details.institution : (item.name || 'Partner Organization'),
    contact_person: item.name || '',
    contact_email: item.email || '',
    contact_phone: item.phone || '',
    country: details.country && details.country !== 'Global Jurisdiction' ? details.country : 'United Kingdom',
    city: details.city || '',
    institution_type: details.institutionType || 'Authorized Training Center',
    programs: details.programs && details.programs.length > 0 ? [...details.programs] : ['CODEX HACCP', 'ISO 22000']
  };
  convertModalOpen.value = true;
};

const executeConvertToPartner = async () => {
  if (!convertForm.value.name?.trim() || !convertForm.value.contact_email?.trim()) {
    alert('Organization Name and Contact Email are required.');
    return;
  }
  convertingPartner.value = true;
  try {
    const payload = {
      name: convertForm.value.name.trim(),
      contact_email: convertForm.value.contact_email.trim(),
      contact_phone: convertForm.value.contact_phone?.trim() || null,
      country: convertForm.value.country?.trim() || 'Global Jurisdiction',
      city: convertForm.value.city?.trim() || '',
      institution_type: convertForm.value.institution_type || 'Authorized Training Center',
      programs: convertForm.value.programs
    };

    await api.post(`/admin/inquiries/${convertForm.value.inquiryId}/convert-partner`, payload);

    // Update local item status to replied
    const item = inquiries.value.find(i => i.id === convertForm.value.inquiryId);
    if (item) {
      item.status = 'replied';
    }
    if (selectedItem.value && selectedItem.value.id === convertForm.value.inquiryId) {
      selectedItem.value.status = 'replied';
    }

    convertedOrgName.value = payload.name;
    convertModalOpen.value = false;
    convertSuccessModalOpen.value = true;
  } catch (err: any) {
    console.error('Failed to convert to partner:', err);
    alert(err?.response?.data?.error || err?.message || 'Failed to convert to partner center.');
  } finally {
    convertingPartner.value = false;
  }
};

const goToPartnerDirectory = () => {
  convertSuccessModalOpen.value = false;
  router.push('/admin/multi-tenant');
};

const confirmDelete = async (item: any) => {
  if (!confirm(`Are you sure you want to delete submission from ${item.name}?`)) return;
  try {
    await api.delete(`/admin/inquiries/${item.id}`);
    inquiries.value = inquiries.value.filter(i => i.id !== item.id);
  } catch (err) {
    alert('Failed to delete submission');
  }
};

onMounted(() => {
  fetchInquiries();
});
</script>

<style scoped>
.gsfin-admin-page {
  padding: 0;
  background: var(--k-bg, #FAFAFD);
  min-height: 100vh;
  box-sizing: border-box;
}
.admin-wrap {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--k-text-muted, #64748B);
  background: rgba(100, 116, 139, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.admin-title {
  font-size: 1.65rem;
  font-weight: 600;
  color: #0F172A;
  margin: 4px 0 4px 0;
  letter-spacing: -0.02em;
}

.admin-subtitle {
  font-size: 0.90rem;
  color: #64748B;
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFFFFF;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 9px 18px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}
.btn-glass:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.25);
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #E31B23;
  color: #FFFFFF;
  border: none;
  padding: 9px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  box-shadow: 0 2px 8px rgba(227, 27, 35, 0.18);
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
}
.btn-red:hover {
  background: #C4131B;
  transform: translateY(-1px);
}

/* Panel & Controls */
.panel-card {
  background: #FFFFFF;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
}

.table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tab-pill-group {
  display: flex;
  gap: 4px;
  background: #F1F5F9;
  padding: 4px;
  border-radius: 12px;
}

.pill-tab-btn {
  background: transparent;
  border: none;
  padding: 7px 15px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pill-tab-btn:hover {
  color: #0F172A;
}
.pill-tab-btn.active {
  background: #FFFFFF;
  color: #0F172A;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.search-filter-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  position: relative;
  width: 270px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 1.05rem;
}
.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.84rem;
  font-weight: 400;
  outline: none;
  background: #FFFFFF;
  color: #0F172A;
  transition: border-color 0.2s ease;
}
.search-input:focus {
  border-color: #2563EB;
}

.filter-select {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 0.84rem;
  font-weight: 500;
  color: #334155;
  background: #FFFFFF;
  outline: none;
  cursor: pointer;
}
.filter-select:focus {
  border-color: #2563EB;
}

/* Table */
.table-responsive {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.gsfin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.th-inst { min-width: 250px; }
.th-contact { min-width: 170px; }
.th-info { min-width: 230px; }
.th-loc { min-width: 150px; }
.th-date { min-width: 120px; }
.th-status { min-width: 95px; }
.th-actions { width: 145px; min-width: 145px; text-align: center; }

.gsfin-table th {
  padding: 12px 18px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  background: #FAFAFD;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  white-space: nowrap;
}
.gsfin-table td {
  padding: 14px 18px;
  font-size: 0.86rem;
  font-weight: 400;
  color: #334155;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  vertical-align: top;
}
.gsfin-table tbody tr {
  transition: background-color 0.15s ease;
}
.gsfin-table tbody tr:hover {
  background: #F8FAFC;
}
.unread-row {
  background: #FFFDFD;
  border-left: 3px solid #E31B23;
}

/* Submission Type & Entity Column */
.col-inst-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.submission-type-wrap {
  margin-bottom: 2px;
}
.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.70rem;
  font-weight: 500;
  white-space: nowrap;
}
.tag-partner {
  background: rgba(16, 185, 129, 0.10);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.20);
}
.tag-general {
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  border: 1px solid rgba(79, 70, 229, 0.18);
}
.inst-primary-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  color: #0F172A;
  line-height: 1.35;
}
.inquiry-msg-snippet {
  font-size: 0.76rem;
  color: #64748B;
  font-style: italic;
  line-height: 1.3;
}

/* Contact Person Column */
.col-contact-person {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.contact-person-name {
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 0.86rem;
  color: #0F172A;
  white-space: nowrap;
}
.contact-person-role {
  font-size: 0.74rem;
  color: #64748B;
  white-space: nowrap;
}

/* Contact Info Column (Email & Phone) */
.col-contact-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.contact-email-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 400;
  color: #334155;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}
.contact-email-link:hover {
  text-decoration: underline;
  color: #2563EB;
}
.contact-phone-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 400;
  color: #64748B;
  white-space: nowrap;
}
.contact-phone-row.text-muted {
  color: #94A3B8;
  font-weight: 400;
  font-style: italic;
}
.contact-icon {
  font-size: 0.90rem;
  color: #94A3B8;
  flex-shrink: 0;
}
.contact-email-link .contact-icon {
  color: #94A3B8;
}

/* Location Column */
.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 500;
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.location-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 400;
  color: #64748B;
  white-space: nowrap;
}

/* Date Cell */
.date-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}
.date-main {
  font-size: 0.82rem;
  font-weight: 500;
  color: #1E293B;
  white-space: nowrap;
}
.date-time {
  font-size: 0.72rem;
  font-weight: 400;
  color: #64748B;
  white-space: nowrap;
}

/* Status Button Badge */
.status-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.70rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.status-new {
  background: rgba(227, 27, 35, 0.08);
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.2);
}
.status-new .status-dot {
  background: #E31B23;
  box-shadow: 0 0 6px rgba(227, 27, 35, 0.5);
}
.status-read {
  background: rgba(100, 116, 139, 0.08);
  color: #64748B;
  border-color: rgba(100, 116, 139, 0.18);
}
.status-read .status-dot {
  background: #94A3B8;
}
.status-replied {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.2);
}
.status-replied .status-dot {
  background: #059669;
}
.status-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

/* Actions Cell */
.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}
.btn-table-action {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 8px;
  font-size: 0.95rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-table-action:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: rgba(15, 23, 42, 0.25);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.btn-view:hover {
  color: #2563EB;
  border-color: rgba(37, 99, 235, 0.3);
  background: #EFF6FF;
}
.btn-reply:hover {
  color: #2563EB;
  border-color: rgba(37, 99, 235, 0.3);
  background: #EFF6FF;
}
.btn-edit:hover {
  color: #4F46E5;
  border-color: rgba(79, 70, 229, 0.35);
  background: #EEF2FF;
}
.btn-convert {
  color: #059669;
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.25);
}
.btn-convert:hover {
  background: #ECFDF5;
  color: #047857;
  border-color: rgba(16, 185, 129, 0.45);
}
.btn-danger {
  color: #94A3B8;
}
.btn-danger:hover {
  background: #FEF2F2;
  color: #E31B23;
  border-color: rgba(227, 27, 35, 0.3);
}

.btn-indigo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #4F46E5;
  color: #FFFFFF;
  border: none;
  padding: 9px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}
.btn-indigo:hover {
  background: #4338CA;
}

/* Loading & Empty States */
.loading-state-box {
  text-align: center;
  padding: 64px 20px;
  color: #64748B;
  font-weight: 500;
}
.loading-text {
  font-size: 0.88rem;
  margin-top: 8px;
}
.spinner-sm-red {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(227, 27, 35, 0.2);
  border-top-color: #E31B23;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-state-cell {
  text-align: center;
  padding: 48px 20px;
  color: #94A3B8;
}
.empty-state-icon {
  font-size: 2.2rem;
  color: #CBD5E1;
  display: block;
  margin-bottom: 8px;
}
.empty-state-text {
  font-size: 0.90rem;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.modal-card {
  background: #FFFFFF;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: calc(100vh - 48px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.16);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-date-sub {
  font-size: 0.75rem;
  color: #64748B;
  font-weight: 500;
}

.icon-box-lg {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
}

.bg-emerald-light {
  background: rgba(16, 185, 129, 0.12);
}
.text-emerald {
  color: #059669;
}
.bg-indigo-light {
  background: rgba(79, 70, 229, 0.10);
}
.text-indigo {
  color: #4F46E5;
}

.status-toggle-hint {
  font-size: 0.80rem;
  margin-left: 3px;
  opacity: 0.75;
  transition: transform 0.25s ease;
}
.status-btn:hover .status-toggle-hint {
  transform: rotate(180deg);
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 650;
  color: #0F172A;
  margin: 0;
  line-height: 1.3;
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
  transition: all 0.15s ease;
}
.modal-close-btn:hover {
  background: #E2E8F0;
  color: #0F172A;
}

.modal-body {
  padding: 22px;
  overflow-y: auto;
  flex: 1;
}

.modal-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (max-width: 500px) {
  .modal-grid-2 {
    grid-template-columns: 1fr;
  }
}

.sender-info-box {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 16px;
}
.info-card-sm {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
}

.detail-label {
  font-size: 0.70rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail-label-block {
  display: block;
  margin-bottom: 4px;
}
.detail-val {
  font-size: 0.86rem;
  font-weight: 500;
  color: #0F172A;
  display: block;
  margin-top: 2px;
}
.detail-email-link {
  color: #2563EB;
  text-decoration: none;
}
.detail-email-link:hover {
  text-decoration: underline;
}
.institution-title {
  color: #1E1B4B;
  font-weight: 600;
  font-size: 0.92rem;
}
.hover-underline:hover {
  text-decoration: underline;
}

.subject-box {
  font-size: 0.88rem;
  font-weight: 500;
  color: #0F172A;
  background: #F1F5F9;
  padding: 10px 14px;
  border-radius: 10px;
}

.message-content-box {
  font-size: 0.86rem;
  color: #334155;
  line-height: 1.6;
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 14px;
  border-radius: 12px;
  white-space: pre-line;
}

.modal-footer {
  padding: 16px 24px;
  background: #FAFAFD;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  box-sizing: border-box;
}

.modal-footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.modal-footer button,
.modal-footer a {
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 640px) {
  .modal-footer {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 10px;
  }
  .modal-footer-actions {
    flex-direction: column;
    width: 100%;
  }
  .modal-footer button,
  .modal-footer a {
    width: 100%;
    justify-content: center;
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.78rem;
}

/* Accreditation Program Badges */
.partner-programs-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.program-tag-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(79, 70, 229, 0.08);
  color: #4F46E5;
  border: 1px solid rgba(79, 70, 229, 0.18);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.70rem;
  font-weight: 500;
  white-space: nowrap;
}
.program-tag-sm i {
  font-size: 0.8rem;
}

.modal-programs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.modal-program-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #F0FDF4;
  color: #166534;
  border: 1px solid #BBF7D0;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 0.80rem;
  font-weight: 500;
}
.modal-program-badge i {
  font-size: 0.95rem;
}

/* Modal Sizes & Layout */
.modal-card-lg {
  max-width: 660px;
}
.modal-card-sm {
  max-width: 440px;
}
.modal-form-wrap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 120px);
}

/* Form Sections & Fields */
.form-section-card {
  background: #F8FAFC;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
}
.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-sub-tip {
  font-size: 0.72rem;
  color: #64748B;
  font-weight: 400;
}
.form-label-bold {
  font-size: 0.80rem;
  font-weight: 600;
  color: #1E293B;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
}
.form-label {
  font-size: 0.76rem;
  font-weight: 500;
  color: #475569;
  display: block;
  margin-bottom: 4px;
}
.required-asterisk {
  color: #E31B23;
  margin-left: 2px;
}
.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border-radius: 9px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #FFFFFF;
  font-size: 0.84rem;
  font-family: inherit;
  color: #0F172A;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #2563EB;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.form-textarea {
  resize: vertical;
  line-height: 1.5;
}
.dual-input-row {
  display: flex;
  gap: 8px;
}

/* Status Radio Pills (Lead Status in Edit) */
.status-options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.status-radio-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}
.status-radio-pill:hover {
  border-color: rgba(15, 23, 42, 0.28);
  background: #F8FAFC;
}
.status-radio-pill.pill-new.selected {
  background: rgba(227, 27, 35, 0.06);
  border-color: #E31B23;
}
.status-radio-pill.pill-read.selected {
  background: rgba(100, 116, 139, 0.08);
  border-color: #64748B;
}
.status-radio-pill.pill-replied.selected {
  background: rgba(16, 185, 129, 0.08);
  border-color: #059669;
}
.status-dot-sm {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bg-red { background: #E31B23; }
.bg-slate { background: #64748B; }
.bg-emerald { background: #059669; }

.status-pill-text {
  display: flex;
  flex-direction: column;
}
.status-pill-title {
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.2;
}
.pill-new .status-pill-title { color: #E31B23; }
.pill-read .status-pill-title { color: #334155; }
.pill-replied .status-pill-title { color: #059669; }
.status-pill-sub {
  font-size: 0.68rem;
  color: #64748B;
  font-weight: 400;
}

/* Programs Toggle Chips */
.programs-toggle-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.program-chip-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 8px;
  border: 1px dashed rgba(79, 70, 229, 0.35);
  background: #FFFFFF;
  color: #475569;
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.program-chip-toggle:hover {
  border-color: #4F46E5;
  color: #4F46E5;
  background: #EEF2FF;
}
.program-chip-toggle.active {
  background: rgba(79, 70, 229, 0.10);
  border: 1px solid #4F46E5;
  color: #4F46E5;
}
.program-chip-toggle.emerald-toggle {
  border-color: rgba(16, 185, 129, 0.35);
}
.program-chip-toggle.emerald-toggle:hover {
  border-color: #059669;
  color: #059669;
  background: #ECFDF5;
}
.program-chip-toggle.emerald-toggle.active {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid #059669;
  color: #059669;
}

/* Convert Banner */
.convert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ECFDF5;
  border: 1px solid #A7F3D0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.82rem;
  color: #047857;
  line-height: 1.4;
}
.convert-banner i {
  font-size: 1.15rem;
  color: #059669;
  flex-shrink: 0;
}

/* Emerald Button */
.btn-emerald {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #059669;
  color: #FFFFFF;
  border: none;
  padding: 9px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}
.btn-emerald:hover {
  background: #047857;
  transform: translateY(-1px);
}
.btn-emerald:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Success Modal */
.success-icon-wrap {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #ECFDF5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2.2rem;
}
.success-title {
  font-size: 1.15rem;
  font-weight: 650;
  color: #0F172A;
  margin: 0;
}
.success-desc {
  font-size: 0.86rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
}
.success-actions-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
.spinner-sm-white {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 600px) {
  .status-options-grid {
    grid-template-columns: 1fr;
  }
  .form-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
