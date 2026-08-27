import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import {
  X,
  Check,
  Building2,
  ShieldAlert,
  Sparkles,
  Plus,
  Trash2,
  Users,
  UserCheck,
  UserPlus,
  Upload,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../styles/theme';
import { createVenue, updateVenue, getAmenities, createAmenity, deleteAmenity, uploadImage } from '../../api/venues';
import { getUsersApi } from '../../api/auth';
import { compressAndResizeImage, PRESET_VENUE_IMAGES, optimizeImageUrl } from '../../utils/imageUtils';

export function VenueFormModal({ visible, venue, onClose, onSuccess }) {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const isEditing = !!venue;

  const isAdmin =
    currentUser?.role?.toUpperCase() === 'ADMIN' ||
    currentUser?.role?.toUpperCase() === 'ADMINISTRADOR' ||
    currentUser?.isAdmin === true ||
    currentUser?.is_admin === true;

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [cancelLimitHours, setCancelLimitHours] = useState('0');
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);
  const [availableAmenities, setAvailableAmenities] = useState([]);

  // Nova comodidade
  const [newAmenityName, setNewAmenityName] = useState('');
  const [addingAmenity, setAddingAmenity] = useState(false);
  const [deletingAmenityId, setDeletingAmenityId] = useState(null);

  // Gestor State (Admin Only)
  const [managerMode, setManagerMode] = useState('select'); // 'select' | 'create'
  const [usersList, setUsersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [loadingAmenities, setLoadingAmenities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickLocalImage = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg('');
    try {
      const compressedDataUrl = await compressAndResizeImage(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.85,
      });
      const uploadedUrl = await uploadImage(compressedDataUrl, 'venue');
      setCoverImageUrl(uploadedUrl);
    } catch (err) {
      console.error('Erro ao processar imagem de capa:', err);
      setErrorMsg(err.message || 'Não foi possível enviar a imagem selecionada.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    async function loadAmenities() {
      setLoadingAmenities(true);
      try {
        const amenitiesData = await getAmenities();
        setAvailableAmenities(amenitiesData);
      } catch (err) {
        console.warn('Erro ao carregar amenities:', err);
      } finally {
        setLoadingAmenities(false);
      }
    }

    async function loadUsers() {
      if (isAdmin && visible) {
        setLoadingUsers(true);
        try {
          const usersData = await getUsersApi();
          setUsersList(usersData);
        } catch (err) {
          console.warn('Erro ao carregar lista de usuários:', err);
        } finally {
          setLoadingUsers(false);
        }
      }
    }

    if (visible) {
      loadAmenities();
      loadUsers();
    }
  }, [visible, isAdmin]);

  useEffect(() => {
    if (visible && venue) {
      setName(venue.name || '');
      setDescription(venue.description || '');
      setAddress(venue.address ? venue.address.split(',')[0].split('-')[0].trim() : '');
      setNumber(venue.number || '');
      setNeighborhood(venue.neighborhood || '');
      setCity(venue.city || '');
      setState(venue.state || 'SP');
      setPhone(venue.phone || '');
      setCoverImageUrl(venue.cover_image_url || venue.image_url || '');
      setCancelLimitHours(venue.cancel_limit_hours != null ? String(venue.cancel_limit_hours) : '0');

      if (venue.user_id || venue.owner?.id) {
        setSelectedUserId(venue.user_id || venue.owner?.id);
      }

      // Comodidades
      if (Array.isArray(venue.amenities)) {
        const matched = availableAmenities
          .filter((a) =>
            venue.amenities.some((va) =>
              typeof va === 'object' ? va.id === a.id || va.name === a.name : va === a.name
            )
          )
          .map((a) => a.id);
        setSelectedAmenityIds(matched);
      } else {
        setSelectedAmenityIds([]);
      }
      setErrorMsg('');
    } else if (visible && !venue) {
      setName('');
      setDescription('');
      setAddress('');
      setNumber('');
      setNeighborhood('');
      setCity('São Paulo');
      setState('SP');
      setPhone('');
      setCoverImageUrl('');
      setCancelLimitHours('0');
      setSelectedAmenityIds([]);
      setSelectedUserId(currentUser?.id || null);
      setNewManagerName('');
      setNewManagerEmail('');
      setNewManagerPassword('');
      setNewManagerPhone('');
      setManagerMode('select');
      setErrorMsg('');
    }
  }, [visible, venue, availableAmenities, currentUser?.id]);

  const toggleAmenity = (amenityId) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleCreateAmenity = async () => {
    if (!newAmenityName.trim()) return;
    setAddingAmenity(true);
    setErrorMsg('');
    try {
      const created = await createAmenity(newAmenityName.trim());
      setAvailableAmenities((prev) => [...prev, created]);
      setSelectedAmenityIds((prev) => [...prev, created.id]);
      setNewAmenityName('');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar nova comodidade.');
    } finally {
      setAddingAmenity(false);
    }
  };

  const handleDeleteAmenity = async (amenityId, amenityName, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setDeletingAmenityId(amenityId);
    setErrorMsg('');
    try {
      await deleteAmenity(amenityId);
      setAvailableAmenities((prev) => prev.filter((a) => a.id !== amenityId));
      setSelectedAmenityIds((prev) => prev.filter((id) => id !== amenityId));
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao excluir comodidade.');
    } finally {
      setDeletingAmenityId(null);
    }
  };

  const validate = () => {
    if (!name.trim()) {
      setErrorMsg('Informe o nome do complexo esportivo.');
      return false;
    }
    if (!address.trim()) {
      setErrorMsg('Informe o endereço do complexo.');
      return false;
    }
    if (!city.trim()) {
      setErrorMsg('Informe a cidade.');
      return false;
    }
    if (!state.trim() || state.trim().length !== 2) {
      setErrorMsg('Informe o estado (UF) com 2 letras (ex: SP).');
      return false;
    }

    if (isAdmin && !isEditing) {
      if (managerMode === 'select' && !selectedUserId) {
        setErrorMsg('Selecione um usuário para ser o gestor deste complexo.');
        return false;
      }
      if (managerMode === 'create') {
        if (!newManagerName.trim()) {
          setErrorMsg('Informe o nome do gestor.');
          return false;
        }
        if (!newManagerEmail.trim() || !newManagerEmail.includes('@')) {
          setErrorMsg('Informe um e-mail válido para o gestor.');
          return false;
        }
        if (!newManagerPassword.trim() || newManagerPassword.trim().length < 8) {
          setErrorMsg('A senha do gestor deve ter no mínimo 8 caracteres.');
          return false;
        }
      }
    }

    setErrorMsg('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim(),
        number: number.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        phone: phone.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
        cancel_limit_hours: parseInt(cancelLimitHours) || 0,
        amenity_ids: selectedAmenityIds,
      };

      if (isAdmin) {
        if (managerMode === 'select' && selectedUserId) {
          payload.user_id = selectedUserId;
        } else if (managerMode === 'create' && newManagerName.trim()) {
          payload.new_manager = {
            name: newManagerName.trim(),
            email: newManagerEmail.trim(),
            password: newManagerPassword.trim(),
            phone: newManagerPhone.trim() || null,
          };
        }
      }

      if (isEditing) {
        await updateVenue(venue.id, payload);
      } else {
        await createVenue(payload);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.message || 'Erro ao salvar complexo esportivo.';
      setErrorMsg(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '18' }]}>
                <Building2 size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isEditing ? 'Editar Complexo Esportivo' : 'Novo Complexo Esportivo'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {isEditing ? 'Atualize os dados e estrutura do complexo' : 'Cadastre um novo espaço esportivo no sistema'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Form Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
                <ShieldAlert size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Seção de Gestor (Apenas para Admin) */}
            {isAdmin ? (
              <View style={[styles.fieldGroup, styles.managerSection, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' }]}>
                <View style={styles.managerHeader}>
                  <Users size={18} color={colors.primary} />
                  <Text style={[styles.sectionHeading, { color: colors.primary }]}>Gestor do Complexo</Text>
                </View>

                <View style={styles.modeToggleRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setManagerMode('select')}
                    style={[
                      styles.modeBtn,
                      {
                        backgroundColor: managerMode === 'select' ? colors.primary : colors.surface,
                        borderColor: managerMode === 'select' ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <UserCheck size={14} color={managerMode === 'select' ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.modeBtnText, { color: managerMode === 'select' ? '#FFFFFF' : colors.text }]}>
                      Selecionar Existente
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setManagerMode('create')}
                    style={[
                      styles.modeBtn,
                      {
                        backgroundColor: managerMode === 'create' ? colors.primary : colors.surface,
                        borderColor: managerMode === 'create' ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <UserPlus size={14} color={managerMode === 'create' ? '#FFFFFF' : colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.modeBtnText, { color: managerMode === 'create' ? '#FFFFFF' : colors.text }]}>
                      Cadastrar Novo Gestor
                    </Text>
                  </TouchableOpacity>
                </View>

                {managerMode === 'select' ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.label, { color: colors.text }]}>Selecione o Usuário Gestor *</Text>
                    {loadingUsers ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
                    ) : usersList.length === 0 ? (
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Nenhum usuário encontrado.</Text>
                    ) : (
                      <ScrollView
                        style={styles.usersListContainer}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ paddingRight: 2 }}
                      >
                        {usersList.map((u) => {
                          const isSelected = selectedUserId === u.id;
                          return (
                            <TouchableOpacity
                              key={u.id}
                              activeOpacity={0.7}
                              onPress={() => setSelectedUserId(u.id)}
                              style={[
                                styles.userOptionCard,
                                {
                                  backgroundColor: isSelected ? colors.primary + '18' : colors.background,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.userNameText, { color: colors.text }]}>{u.name}</Text>
                                <Text style={[styles.userEmailText, { color: colors.textMuted }]}>{u.email}</Text>
                              </View>
                              <View style={[styles.roleBadge, { backgroundColor: u.role === 'ADMIN' ? '#EF444415' : u.role === 'GESTOR_ESPACO' ? '#3B82F615' : '#10B98115' }]}>
                                <Text style={[styles.roleBadgeText, { color: u.role === 'ADMIN' ? '#EF4444' : u.role === 'GESTOR_ESPACO' ? '#3B82F6' : '#10B981' }]}>
                                  {u.role === 'GESTOR_ESPACO' ? 'GESTOR' : u.role}
                                </Text>
                              </View>
                              {isSelected ? <Check size={16} color={colors.primary} style={{ marginLeft: 6 }} /> : null}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                ) : (
                  <View style={{ marginTop: 8, gap: 10 }}>
                    <View>
                      <Text style={[styles.label, { color: colors.text }]}>Nome do Gestor *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="Ex: Carlos Silva"
                        placeholderTextColor={colors.textMuted}
                        value={newManagerName}
                        onChangeText={setNewManagerName}
                      />
                    </View>

                    <View>
                      <Text style={[styles.label, { color: colors.text }]}>E-mail do Gestor *</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="gestor@exemplo.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={newManagerEmail}
                        onChangeText={setNewManagerEmail}
                      />
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text }]}>Senha de Acesso *</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          placeholder="Mínimo 8 caracteres"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                          value={newManagerPassword}
                          onChangeText={setNewManagerPassword}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: colors.text }]}>Telefone / WhatsApp</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                          placeholder="(11) 99999-9999"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="phone-pad"
                          value={newManagerPhone}
                          onChangeText={setNewManagerPhone}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ) : null}

            {/* Nome do Complexo */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nome do Complexo *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: Arena Central Esportes"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Descrição */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Descrição / Apresentação</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Descreva a estrutura, localização e destaques do complexo..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Endereço & Número */}
            <View style={styles.rowInputs}>
              <View style={[styles.fieldGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Endereço *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Ex: Av. Paulista"
                  placeholderTextColor={colors.textMuted}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Número</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="1500"
                  placeholderTextColor={colors.textMuted}
                  value={number}
                  onChangeText={setNumber}
                />
              </View>
            </View>

            {/* Bairro, Cidade & Estado */}
            <View style={styles.rowInputs}>
              <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Bairro</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Bela Vista"
                  placeholderTextColor={colors.textMuted}
                  value={neighborhood}
                  onChangeText={setNeighborhood}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1.5 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Cidade *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="São Paulo"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 0.8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>UF *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="SP"
                  placeholderTextColor={colors.textMuted}
                  maxLength={2}
                  autoCapitalize="characters"
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            {/* Telefone de Contato */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Telefone / WhatsApp do Complexo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="(11) 98888-8888"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Imagem de Capa do Complexo (Upload, Presets HD & URL) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Imagem de Capa do Complexo</Text>

              {/* Seletor de Arquivo Local com Compressão */}
              {Platform.OS === 'web' ? (
                <View style={styles.uploadRow}>
                  <label style={{ cursor: 'pointer', display: 'inline-flex', width: '100%' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePickLocalImage}
                      style={{ display: 'none' }}
                    />
                    <View style={[styles.uploadBtn, { backgroundColor: colors.background, borderColor: colors.primary }]}>
{uploadingImage ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                        <>
                          <Upload size={16} color={colors.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.uploadBtnText, { color: colors.primary }]}>
                            Upload Foto de Capa
                          </Text>
                        </>
                      )}
                    </View>
                  </label>
                </View>
              ) : null}

              {/* Galeria de Presets HD */}
              <Text style={[styles.subLabel, { color: colors.textMuted, marginTop: 8 }]}>Ou escolha uma capa HD pronta:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                <View style={styles.presetGrid}>
                  {PRESET_VENUE_IMAGES.map((preset) => {
                    const isSelected = coverImageUrl === preset.url;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        activeOpacity={0.8}
                        onPress={() => setCoverImageUrl(preset.url)}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isSelected ? colors.primary + '20' : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <ImageIcon size={13} color={isSelected ? colors.primary : colors.textMuted} />
                        <Text style={[styles.presetChipText, { color: isSelected ? colors.primary : colors.text }]}>
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Campo de URL Direto */}
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, marginTop: 4 }]}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor={colors.textMuted}
                value={coverImageUrl}
                onChangeText={setCoverImageUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Pré-visualização da Capa */}
              {coverImageUrl.trim() ? (
                <View style={[styles.imagePreviewContainer, { borderColor: colors.border }]}>
                  <Image
                    source={{ uri: optimizeImageUrl(coverImageUrl.trim(), { width: 1600, quality: 90 }) }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                </View>
              ) : null}
            </View>

            {/* Limite de Cancelamento */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Antecedência para Cancelamento (Horas)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: 2"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={cancelLimitHours}
                onChangeText={setCancelLimitHours}
              />
              <Text style={[{ color: colors.textMuted, marginTop: 4, fontSize: 11 }]}>Tempo mínimo antes da partida para o cliente poder cancelar. Deixe 0 para cancelamento livre.</Text>
            </View>

            {/* Comodidades (Amenities) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Comodidades Oferecidas</Text>
              
              {/* Adicionar Nova Comodidade Input Row */}
              <View style={styles.addAmenityRow}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Cadastrar nova comodidade..."
                  placeholderTextColor={colors.textMuted}
                  value={newAmenityName}
                  onChangeText={setNewAmenityName}
                  onSubmitEditing={handleCreateAmenity}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCreateAmenity}
                  disabled={addingAmenity || !newAmenityName.trim()}
                  style={[
                    styles.btnAddAmenity,
                    { backgroundColor: colors.primary, opacity: (!newAmenityName.trim() || addingAmenity) ? 0.6 : 1 },
                  ]}
                >
                  {addingAmenity ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.btnAddAmenityText}>Adicionar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {loadingAmenities ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
              ) : (
                <View style={styles.amenitiesGrid}>
                  {availableAmenities.map((amenity) => {
                    const isSelected = selectedAmenityIds.includes(amenity.id);
                    const isDeletingThis = deletingAmenityId === amenity.id;
                    return (
                      <TouchableOpacity
                        key={amenity.id}
                        activeOpacity={0.7}
                        onPress={() => toggleAmenity(amenity.id)}
                        style={[
                          styles.amenityChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.amenityChipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                          {amenity.name}
                        </Text>
                        {isSelected ? <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} /> : null}

                        {/* Botão de Excluir Comodidade */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={(e) => handleDeleteAmenity(amenity.id, amenity.name, e)}
                          style={[styles.deleteAmenityBtn, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.error + '18' }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          title="Apagar comodidade"
                          disabled={isDeletingThis}
                        >
                          {isDeletingThis ? (
                            <ActivityIndicator size="small" color={isSelected ? '#FFFFFF' : colors.error} />
                          ) : (
                            <Trash2 size={13} color={isSelected ? '#FFFFFF' : colors.error} />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.btnCancel, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.btnCancelText, { color: colors.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSave, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnSaveText}>
                    {isEditing ? 'Salvar Alterações' : 'Criar Complexo'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs || 8,
    paddingVertical: theme.spacing.sm,
  },
  modalContainer: {
    width: '96%',
    maxWidth: 600,
    maxHeight: '92%',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.body1,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: theme.typography.sizes.caption,
  },
  closeButton: {
    padding: 6,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  errorText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    flex: 1,
  },
  managerSection: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  managerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '700',
  },
  usersListContainer: {
    maxHeight: 180,
  },
  userOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  userNameText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  userEmailText: {
    fontSize: theme.typography.sizes.caption,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    marginRight: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fieldGroup: {
    marginBottom: theme.spacing.md,
  },
  rowInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.sizes.body2,
  },
  textArea: {
    height: 80,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  addAmenityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  btnAddAmenity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: theme.radius.md,
  },
  btnAddAmenityText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '700',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    gap: 4,
  },
  amenityChipText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
  },
  deleteAmenityBtn: {
    marginLeft: 6,
    padding: 3,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadRow: {
    marginBottom: 4,
  },
  uploadBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  presetGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    gap: 4,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    height: 140,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  hdBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  hdBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    gap: 8,
  },
  btnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  btnCancelText: {
    fontSize: theme.typography.sizes.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnSave: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body2,
    fontWeight: '700',
    textAlign: 'center',
  },
});
