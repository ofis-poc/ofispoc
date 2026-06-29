'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  ChevronLeft, 
  Languages, 
  Loader2, 
  Sparkles, 
  Globe, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  Save,
  ArrowRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Info,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Survey, SurveyQuestion, QuestionType, Farmer } from '@/types';

// Supported languages
const SUPPORTED_LANGUAGES = ['English', 'Hindi', 'Spanish', 'Thai'];

// Supported question types
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'single', label: 'Single Choice' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'text', label: 'Text' },
  { value: 'voice', label: 'Voice' },
];

export default function SurveyBuilderPage() {
  // Navigation & view states
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Survey Creation Modal states (Step 1)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyEditingId, setSurveyEditingId] = useState<string | null>(null);
  const [surveyName, setSurveyName] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyStatus, setSurveyStatus] = useState<'Draft' | 'Published'>('Draft');
  const [surveyLanguages, setSurveyLanguages] = useState<string[]>(['English']);

  // Question Card Builder inline state (Step 3)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Question Card fields
  const [questionEn, setQuestionEn] = useState('');
  const [questionHi, setQuestionHi] = useState('');
  const [questionEs, setQuestionEs] = useState('');
  const [questionTh, setQuestionTh] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('text');
  const [questionRequired, setQuestionRequired] = useState(false);
  
  // Option fields for Single Choice questions
  const [optionsEn, setOptionsEn] = useState<string[]>(['', '']);
  const [optionsHi, setOptionsHi] = useState<string[]>([]);
  const [optionsEs, setOptionsEs] = useState<string[]>([]);
  const [optionsTh, setOptionsTh] = useState<string[]>([]);

  // Translation review states
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'English' | 'Hindi' | 'Spanish' | 'Thai'>('English');

  // Drag & drop state tracker
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Publish / Assignment Modal states (prompt3)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishSurveyTarget, setPublishSurveyTarget] = useState<Survey | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]); // array of farmer phone numbers
  const [farmersSearchTerm, setFarmersSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Trigger notification toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all surveys from DB
  const loadSurveys = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (data.success) {
        setSurveys(data.data);
      } else {
        showToast(data.error || 'Failed to fetch surveys', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  // Fetch all questions for active survey
  const loadQuestions = async (surveyId: string) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      } else {
        showToast(data.error || 'Failed to load questions', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading survey questions', 'error');
    }
  };

  // Open survey builder editor
  const handleOpenSurvey = async (survey: Survey) => {
    setActiveSurvey(survey);
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
    await loadQuestions(survey.id);
  };

  // Handle open new survey modal (Step 1)
  const handleNewSurveyClick = () => {
    setSurveyEditingId(null);
    setSurveyName('');
    setSurveyDescription('');
    setSurveyStatus('Draft');
    setSurveyLanguages(['English']);
    setIsSurveyModalOpen(true);
  };

  // Handle open edit survey settings modal
  const handleEditSurveyClick = (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    setSurveyEditingId(survey.id);
    setSurveyName(survey.name);
    setSurveyDescription(survey.description || '');
    setSurveyStatus(survey.status);
    setSurveyLanguages(survey.languages);
    setIsSurveyModalOpen(true);
  };

  // Handle save survey settings (creates or updates survey metadata)
  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyName.trim()) {
      showToast('Survey Name is required', 'error');
      return;
    }

    const payload = {
      id: surveyEditingId || undefined,
      name: surveyName.trim(),
      description: surveyDescription.trim() || undefined,
      status: surveyStatus,
      languages: surveyLanguages,
    };

    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Survey "${payload.name}" saved successfully!`);
        setIsSurveyModalOpen(false);
        await loadSurveys();
        // If editing metadata of current active survey, reload active survey
        if (activeSurvey && activeSurvey.id === data.data.id) {
          handleOpenSurvey(data.data);
        }
      } else {
        showToast(data.error || 'Failed to save survey', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving survey', 'error');
    }
  };

  // Handle delete survey
  const handleDeleteSurvey = async (surveyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this survey and all of its questions? This action is permanent.')) return;

    try {
      const res = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Survey deleted successfully');
        loadSurveys();
        if (activeSurvey?.id === surveyId) {
          setActiveSurvey(null);
        }
      } else {
        showToast(data.error || 'Failed to delete survey', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting survey', 'error');
    }
  };

  // Handle duplicate survey
  const handleDuplicateSurvey = async (surveyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/surveys/${surveyId}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Survey duplicated successfully!');
        await loadSurveys();
      } else {
        showToast(data.error || 'Failed to duplicate survey', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error duplicating survey', 'error');
    }
  };

  // Supported languages change toggler
  const handleLanguageToggle = (lang: string) => {
    if (lang === 'English') return; // English is required
    if (surveyLanguages.includes(lang)) {
      setSurveyLanguages(surveyLanguages.filter(l => l !== lang));
    } else {
      setSurveyLanguages([...surveyLanguages, lang]);
    }
  };

  // ----------------------------------------------------
  // SURVEY PUBLISH & ASSIGNMENT FLOW (prompt3)
  // ----------------------------------------------------
  
  // Open publish & assign modal
  const openPublishModal = async (survey: Survey) => {
    setPublishSurveyTarget(survey);
    setSelectedFarmers([]);
    setFarmersSearchTerm('');
    setIsPublishModalOpen(true);
    
    try {
      const res = await fetch('/api/farmers');
      const data = await res.json();
      if (data.success) {
        setFarmers(data.data);
      } else {
        showToast(data.error || 'Failed to load farmers list', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading listed farmers', 'error');
    }
  };

  // Handle check/uncheck farmer
  const handleFarmerToggle = (phoneNo: string) => {
    if (selectedFarmers.includes(phoneNo)) {
      setSelectedFarmers(selectedFarmers.filter(p => p !== phoneNo));
    } else {
      setSelectedFarmers([...selectedFarmers, phoneNo]);
    }
  };

  // Handle Select All (filtered farmers)
  const handleSelectAll = (filteredList: Farmer[]) => {
    const allFilteredPhones = filteredList.map(f => f.phoneNo);
    // Combine unique values
    const union = Array.from(new Set([...selectedFarmers, ...allFilteredPhones]));
    setSelectedFarmers(union);
  };

  // Handle Unselect All (filtered farmers)
  const handleUnselectAll = (filteredList: Farmer[]) => {
    const allFilteredPhones = filteredList.map(f => f.phoneNo);
    setSelectedFarmers(selectedFarmers.filter(p => !allFilteredPhones.includes(p)));
  };

  // Dispatch Assignment & Trigger Webhook
  const handleAssignSurvey = async () => {
    if (selectedFarmers.length === 0) {
      showToast('At least 1 farmer must be selected.', 'error');
      return;
    }
    if (!publishSurveyTarget) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/surveys/${publishSurveyTarget.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumbers: selectedFarmers })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('Survey published and assigned successfully!');
        setIsPublishModalOpen(false);
        setPublishSurveyTarget(null);
        
        // Reload surveys list
        await loadSurveys();
        // If we are currently editing this survey, refresh the editor too
        if (activeSurvey && activeSurvey.id === publishSurveyTarget.id) {
          handleOpenSurvey({ ...activeSurvey, status: 'Published' });
        }
      } else {
        showToast(data.error || 'Failed to assign survey', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error completing survey assignment', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ----------------------------------------------------
  // QUESTION MANAGEMENT FUNCTIONS (INLINE BUILDER)
  // ----------------------------------------------------

  // Setup options list
  const initializeOptions = (qType: QuestionType) => {
    if (qType === 'single') {
      setOptionsEn(['Option 1', 'Option 2']);
      setOptionsHi(['', '']);
      setOptionsEs(['', '']);
      setOptionsTh(['', '']);
    } else {
      setOptionsEn([]);
      setOptionsHi([]);
      setOptionsEs([]);
      setOptionsTh([]);
    }
  };

  // Open inline add question card
  const handleAddQuestionClick = () => {
    setIsAddingQuestion(true);
    setEditingQuestionId(null);
    setQuestionEn('');
    setQuestionHi('');
    setQuestionEs('');
    setQuestionTh('');
    setQuestionType('text');
    setQuestionRequired(false);
    initializeOptions('text');
    setActiveLangTab('English');
  };

  // Open inline edit question card
  const handleEditQuestionClick = (q: SurveyQuestion) => {
    setIsAddingQuestion(false);
    setEditingQuestionId(q.id);
    setQuestionEn(q.questionEn);
    setQuestionHi(q.questionHi || '');
    setQuestionEs(q.questionEs || '');
    setQuestionTh(q.questionTh || '');
    setQuestionType(q.questionType);
    setQuestionRequired(q.required);
    setOptionsEn(q.optionsEn || ['', '']);
    setOptionsHi(q.optionsHi || []);
    setOptionsEs(q.optionsEs || []);
    setOptionsTh(q.optionsTh || []);
    setActiveLangTab('English');
  };

  // Cancel inline builder
  const handleCancelQuestionBuild = () => {
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
  };

  // Duplicate question inline
  const handleDuplicateQuestion = async (q: SurveyQuestion) => {
    if (!activeSurvey) return;
    const duplicated: SurveyQuestion = {
      ...q,
      id: '', // database will generate a new id
      questionEn: `${q.questionEn} (Copy)`,
      questionOrder: questions.length + 1,
    };

    try {
      const res = await fetch(`/api/surveys/${activeSurvey.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Question duplicated successfully');
        await loadQuestions(activeSurvey.id);
      } else {
        showToast(data.error || 'Failed to duplicate question', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error duplicating question', 'error');
    }
  };

  // Delete question inline
  const handleDeleteQuestion = async (questionId: string) => {
    if (!activeSurvey) return;
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const res = await fetch(`/api/surveys/${activeSurvey.id}/questions/${questionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Question deleted successfully');
        await loadQuestions(activeSurvey.id);
        if (editingQuestionId === questionId) {
          setEditingQuestionId(null);
        }
      } else {
        showToast(data.error || 'Failed to delete question', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting question', 'error');
    }
  };

  // Options edit helpers
  const handleAddOptionField = () => {
    const nextNum = optionsEn.length + 1;
    setOptionsEn([...optionsEn, `Option ${nextNum}`]);
    setOptionsHi([...optionsHi, '']);
    setOptionsEs([...optionsEs, '']);
    setOptionsTh([...optionsTh, '']);
  };

  const handleRemoveOptionField = (index: number) => {
    if (optionsEn.length <= 1) return;
    setOptionsEn(optionsEn.filter((_, i) => i !== index));
    setOptionsHi(optionsHi.filter((_, i) => i !== index));
    setOptionsEs(optionsEs.filter((_, i) => i !== index));
    setOptionsTh(optionsTh.filter((_, i) => i !== index));
  };

  const handleOptionChange = (value: string, index: number, lang: 'en' | 'hi' | 'es' | 'th') => {
    if (lang === 'en') {
      const updated = [...optionsEn];
      updated[index] = value;
      setOptionsEn(updated);
    } else if (lang === 'hi') {
      const updated = [...optionsHi];
      updated[index] = value;
      setOptionsHi(updated);
    } else if (lang === 'es') {
      const updated = [...optionsEs];
      updated[index] = value;
      setOptionsEs(updated);
    } else if (lang === 'th') {
      const updated = [...optionsTh];
      updated[index] = value;
      setOptionsTh(updated);
    }
  };

  // Reorder options
  const handleMoveOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === optionsEn.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const swap = (arr: string[]) => {
      const cloned = [...arr];
      const temp = cloned[index];
      cloned[index] = cloned[swapIndex];
      cloned[swapIndex] = temp;
      return cloned;
    };

    setOptionsEn(swap(optionsEn));
    if (optionsHi.length > 0) setOptionsHi(swap(optionsHi));
    if (optionsEs.length > 0) setOptionsEs(swap(optionsEs));
    if (optionsTh.length > 0) setOptionsTh(swap(optionsTh));
  };

  // Call FreeLLMAPI for translations
  const handleGenerateTranslation = async () => {
    if (!activeSurvey) return;
    if (!questionEn.trim()) {
      showToast('Please enter the English Question text first', 'error');
      return;
    }

    const targetLangs = activeSurvey.languages.filter(l => l !== 'English');
    if (targetLangs.length === 0) {
      showToast('This survey only supports English. Choose additional languages in Survey Settings first.', 'error');
      return;
    }

    const filteredOptionsEn = questionType === 'single' ? optionsEn.filter(o => o.trim() !== '') : [];

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionEn,
          optionsEn: filteredOptionsEn.length > 0 ? filteredOptionsEn : undefined,
          targetLanguages: targetLangs
        })
      });

      const data = await res.json();
      if (data.success) {
        const trans = data.data;

        if (trans.Hindi) {
          setQuestionHi(trans.Hindi.question || '');
          setOptionsHi(trans.Hindi.options || []);
        }
        if (trans.Spanish) {
          setQuestionEs(trans.Spanish.question || '');
          setOptionsEs(trans.Spanish.options || []);
        }
        if (trans.Thai) {
          setQuestionTh(trans.Thai.question || '');
          setOptionsTh(trans.Thai.options || []);
        }
        showToast('Translations generated successfully! Review them in the language tabs below.');
      } else {
        showToast(data.error || 'Failed to generate translations', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error calling translation service', 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  // Save Question to database
  const handleSaveQuestion = async () => {
    if (!activeSurvey) return;
    if (!questionEn.trim()) {
      showToast('English Question text is required', 'error');
      return;
    }

    const filteredOptionsEn = questionType === 'single' ? optionsEn.filter(o => o.trim() !== '') : undefined;
    
    const fillOptions = (list: string[], size: number) => {
      const filled = [...list];
      while (filled.length < size) {
        filled.push('');
      }
      return filled.slice(0, size);
    };

    const refSize = filteredOptionsEn ? filteredOptionsEn.length : 0;

    // Build question payload
    const qOrder = editingQuestionId 
      ? (questions.find(q => q.id === editingQuestionId)?.questionOrder || questions.length + 1)
      : questions.length + 1;

    const payload: SurveyQuestion = {
      id: editingQuestionId || '',
      surveyId: activeSurvey.id,
      questionEn: questionEn.trim(),
      questionHi: activeSurvey.languages.includes('Hindi') && questionHi.trim() ? questionHi.trim() : undefined,
      questionEs: activeSurvey.languages.includes('Spanish') && questionEs.trim() ? questionEs.trim() : undefined,
      questionTh: activeSurvey.languages.includes('Thai') && questionTh.trim() ? questionTh.trim() : undefined,
      optionsEn: filteredOptionsEn,
      optionsHi: filteredOptionsEn && activeSurvey.languages.includes('Hindi') ? fillOptions(optionsHi, refSize) : undefined,
      optionsEs: filteredOptionsEn && activeSurvey.languages.includes('Spanish') ? fillOptions(optionsEs, refSize) : undefined,
      optionsTh: filteredOptionsEn && activeSurvey.languages.includes('Thai') ? fillOptions(optionsTh, refSize) : undefined,
      questionType,
      questionOrder: qOrder,
      required: questionRequired
    };

    try {
      const res = await fetch(`/api/surveys/${activeSurvey.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Question saved successfully!`);
        setIsAddingQuestion(false);
        setEditingQuestionId(null);
        await loadQuestions(activeSurvey.id);
      } else {
        showToast(data.error || 'Failed to save question', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving question to database', 'error');
    }
  };

  // ----------------------------------------------------
  // DRAG & DROP REORDERING OF QUESTIONS
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...questions];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Re-assign order indices
    const updated = reordered.map((item, idx) => ({
      ...item,
      questionOrder: idx + 1
    }));

    // Update state immediately for smooth UI transition
    setQuestions(updated);
    setDraggedIndex(null);

    // Persist reordered indices to database via API
    try {
      const body = updated.map(item => ({ id: item.id, questionOrder: item.questionOrder }));
      const res = await fetch(`/api/surveys/${activeSurvey!.id}/questions/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) {
        showToast('Failed to save question order to database', 'error');
        // Revert by re-loading questions
        await loadQuestions(activeSurvey!.id);
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving question orders', 'error');
      await loadQuestions(activeSurvey!.id);
    }
  };

  const handleMoveQuestionManual = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((item, idx) => ({
      ...item,
      questionOrder: idx + 1
    }));

    setQuestions(updated);

    try {
      const body = updated.map(item => ({ id: item.id, questionOrder: item.questionOrder }));
      const res = await fetch(`/api/surveys/${activeSurvey!.id}/questions/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.success) {
        showToast('Failed to save question order', 'error');
        await loadQuestions(activeSurvey!.id);
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving question orders', 'error');
      await loadQuestions(activeSurvey!.id);
    }
  };

  const getQuestionTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'single': return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400">Single Choice</Badge>;
      case 'numeric': return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400">Numeric</Badge>;
      case 'text': return <Badge className="bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/20 dark:text-green-400">Text</Badge>;
      case 'voice': return <Badge className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-400">Voice</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Filter listed farmers for searchable selector
  const filteredFarmers = farmers.filter(f => 
    f.phoneNo.includes(farmersSearchTerm) || 
    (f.name && f.name.toLowerCase().includes(farmersSearchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative max-w-full min-h-screen pb-16">
      {/* Toast Alert System */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-600 border-emerald-700 text-white' 
            : 'bg-red-600 border-red-700 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ----------------------------------------------------
          SURVEY LIST VIEW (STEP 2)
      ---------------------------------------------------- */}
      {!activeSurvey ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Survey Builder
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Create multilingual WhatsApp surveys for farmers.
              </p>
            </div>
            <div>
              <Button
                onClick={handleNewSurveyClick}
                className="flex items-center gap-2 w-full sm:w-auto h-10 shadow-xs cursor-pointer active:scale-98 duration-100 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <Plus className="h-4 w-4" />
                Create Survey
              </Button>
            </div>
          </div>

          <Card className="border-zinc-200/80 dark:border-zinc-800/80">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/80">
              <CardTitle>WhatsApp Surveys</CardTitle>
              <CardDescription>Select a survey to manage and build questions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <span>Loading surveys...</span>
                </div>
              ) : surveys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                  <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                  <span className="font-medium">No surveys created yet</span>
                  <Button variant="outline" size="sm" onClick={handleNewSurveyClick}>Create your first survey</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Survey Name</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Supported Languages</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {surveys.map((s) => (
                      <TableRow 
                        key={s.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                        onClick={() => handleOpenSurvey(s)}
                      >
                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-150 pl-6">
                          <div>{s.name}</div>
                          {s.description && (
                            <div className="text-xs font-normal text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                              {s.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {s.questionCount}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {s.languages.map((lang) => (
                              <Badge key={lang} variant="secondary" className="text-xs font-normal py-0">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.status === 'Published' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-450">Published</Badge>
                          ) : (
                            <Badge variant="outline" className="text-zinc-500 dark:text-zinc-400">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(s.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1 px-2.5"
                              onClick={() => handleOpenSurvey(s)}
                            >
                              <Edit className="h-4.5 w-4.5" />
                              Edit Survey
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 w-9 p-0"
                              title="Duplicate Survey"
                              onClick={(e) => handleDuplicateSurvey(s.id, e)}
                            >
                              <Copy className="h-4.5 w-4.5 text-zinc-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2.5"
                              onClick={(e) => { e.stopPropagation(); openPublishModal(s); }}
                            >
                              Publish
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 w-9 p-0 hover:text-red-655 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Delete Survey"
                              onClick={(e) => handleDeleteSurvey(s.id, e)}
                            >
                              <Trash2 className="h-4.5 w-4.5 text-zinc-500 hover:text-inherit" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* ----------------------------------------------------
            SURVEY BUILDER LAYOUT VIEW (STEP 3)
        ---------------------------------------------------- */
        <>
          {/* Header & Back button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setActiveSurvey(null); loadSurveys(); }}
                className="h-9 w-9 p-0 flex items-center justify-center cursor-pointer border border-zinc-200 dark:border-zinc-850"
              >
                <ChevronLeft className="h-5 w-5 text-zinc-650" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                    {activeSurvey.name}
                  </h1>
                  {activeSurvey.status === 'Published' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-450">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-500">Draft</Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Languages: {activeSurvey.languages.join(', ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleEditSurveyClick(activeSurvey, e)}
                className="h-10 text-xs font-semibold px-4 cursor-pointer"
              >
                Edit Settings
              </Button>
              
              <Button
                onClick={() => openPublishModal(activeSurvey)}
                className="h-10 text-xs font-semibold px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Publish Survey
              </Button>
            </div>
          </div>


          {/* Questions Container Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
              <span>Questions Schema</span>
              <span className="text-xs font-normal capitalize">Drag and drop cards to reorder</span>
            </h2>

            {questions.length === 0 && !isAddingQuestion ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-xl text-zinc-550">
                <Globe className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="text-sm font-medium">No questions added yet</p>
                <p className="text-xs text-zinc-400 mt-1">Get started by creating your first WhatsApp question card below.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, index) => {
                  const isEditingThis = editingQuestionId === q.id;

                  if (isEditingThis) {
                    return (
                      <div key={q.id} className="animate-in fade-in-50 duration-150">
                        {renderQuestionEditorCard(q.id)}
                      </div>
                    );
                  }

                  // Render display/view question card (Draggable)
                  return (
                    <Card
                      key={q.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`group transition-all duration-200 border-zinc-200/80 dark:border-zinc-800/80 ${
                        draggedIndex === index ? 'opacity-40 bg-zinc-50 dark:bg-zinc-900/40' : 'hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <CardContent className="p-5 flex items-start gap-3">
                        {/* Drag Handle & Reordering controls */}
                        <div className="flex flex-col items-center gap-1 text-zinc-400 cursor-grab active:cursor-grabbing select-none mt-1">
                          <GripVertical className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <button 
                            disabled={index === 0} 
                            onClick={() => handleMoveQuestionManual(index, 'up')}
                            className="p-0.5 hover:text-zinc-650 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button 
                            disabled={index === questions.length - 1} 
                            onClick={() => handleMoveQuestionManual(index, 'down')}
                            className="p-0.5 hover:text-zinc-650 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Question Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-650 dark:text-zinc-300">Q{q.questionOrder}</span>
                            {getQuestionTypeBadge(q.questionType)}
                            {q.required && (
                              <Badge className="bg-red-55 text-red-650 border border-red-200/30 text-[10px] py-0 px-1.5 font-normal dark:bg-red-950/20 dark:text-red-400">Required</Badge>
                            )}
                            
                            {/* Translation tags indicator */}
                            <div className="flex gap-1 ml-auto text-[9px] text-zinc-400">
                              {activeSurvey.languages.map(l => {
                                const isFilled = l === 'English' || 
                                  (l === 'Hindi' && q.questionHi) ||
                                  (l === 'Spanish' && q.questionEs) ||
                                  (l === 'Thai' && q.questionTh);
                                return (
                                  <span key={l} className={`px-1 py-0.2 rounded border ${
                                    isFilled ? 'bg-emerald-50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400' : 'bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800/40 dark:text-zinc-600'
                                  }`}>{l[0]}</span>
                                );
                              })}
                            </div>
                          </div>

                          <p className="text-zinc-900 dark:text-zinc-100 font-semibold">{q.questionEn}</p>

                          {/* Options display */}
                          {q.optionsEn && q.optionsEn.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                              {q.optionsEn.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 bg-zinc-50/50 dark:bg-zinc-900/10">
                                  <span className="font-semibold text-zinc-400">{i + 1}.</span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Question actions */}
                        <div className="flex items-center gap-1.5 self-start ml-2 opacity-85 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0"
                            title="Edit"
                            onClick={() => handleEditQuestionClick(q)}
                          >
                            <Edit className="h-4.5 w-4.5 text-zinc-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0"
                            title="Duplicate"
                            onClick={() => handleDuplicateQuestion(q)}
                          >
                            <Copy className="h-4.5 w-4.5 text-zinc-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 w-9 p-0 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Delete"
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            <Trash2 className="h-4.5 w-4.5 text-zinc-500 hover:text-inherit" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Inline Question Add Card */}
            {isAddingQuestion && (
              <div className="animate-in fade-in-50 duration-150">
                {renderQuestionEditorCard(null)}
              </div>
            )}

            {/* Bottom Add Question Button */}
            {!isAddingQuestion && !editingQuestionId && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleAddQuestionClick}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 px-6 shadow-md"
                >
                  <Plus className="h-5 w-5" />
                  Add Question
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ----------------------------------------------------
          SURVEY META CREATE/EDIT MODAL
      ---------------------------------------------------- */}
      {isSurveyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {surveyEditingId ? 'Survey Settings' : 'Create Survey'}
              </h2>
              <button 
                onClick={() => setIsSurveyModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-550 dark:hover:text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSurvey}>
              <div className="px-6 py-5 space-y-4">
                {/* Survey Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                    Survey Name
                  </label>
                  <Input
                    required
                    value={surveyName}
                    onChange={(e) => setSurveyName(e.target.value)}
                    placeholder="e.g. Cocoa Yield & Disease Diagnostics Survey"
                    className="h-10 border-zinc-250 dark:border-zinc-800"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                    Description
                  </label>
                  <Textarea
                    value={surveyDescription}
                    onChange={(e) => setSurveyDescription(e.target.value)}
                    placeholder="Provide details about the target group or purpose of the WhatsApp survey."
                    rows={3}
                    className="border-zinc-250 dark:border-zinc-800"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSurveyStatus('Draft')}
                      className={`flex-1 py-2 px-3 border rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all ${
                        surveyStatus === 'Draft'
                          ? 'border-zinc-700 bg-zinc-800 text-white dark:border-zinc-300 dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-700'
                          : 'border-zinc-200 bg-transparent text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurveyStatus('Published')}
                      className={`flex-1 py-2 px-3 border rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all ${
                        surveyStatus === 'Published'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-zinc-200 bg-transparent text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900/40'
                      }`}
                    >
                      <Globe className="h-4 w-4" />
                      Published
                    </button>
                  </div>
                </div>

                {/* Supported Languages */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                    Supported Languages
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isEnglish = lang === 'English';
                      const isSelected = surveyLanguages.includes(lang) || isEnglish;
                      return (
                        <button
                          type="button"
                          key={lang}
                          disabled={isEnglish}
                          onClick={() => handleLanguageToggle(lang)}
                          className={`py-2 px-3 border rounded-lg text-xs font-semibold text-left flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450'
                              : 'border-zinc-200 bg-transparent text-zinc-550 dark:border-zinc-800 dark:text-zinc-450 hover:bg-zinc-50'
                          }`}
                        >
                          <span>{lang}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/20">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsSurveyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Save Survey
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          PUBLISH SURVEY & FARMER ASSIGNMENT MODAL (prompt3)
      ---------------------------------------------------- */}
      {isPublishModalOpen && publishSurveyTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Publish & Assign Survey
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Survey: <span className="font-semibold text-zinc-650 dark:text-zinc-300">{publishSurveyTarget.name}</span>
                </p>
              </div>
              <button 
                disabled={assigning}
                onClick={() => { setIsPublishModalOpen(false); setPublishSurveyTarget(null); }}
                className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-550 dark:hover:text-zinc-400 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              
              {/* Selected Count Indicator & Search bar */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  Selected:{' '}
                  <span className={`font-bold ${selectedFarmers.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-450'}`}>
                    {selectedFarmers.length} farmers
                  </span>
                </div>
                
                {/* Search Input */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-450" />
                  <Input
                    placeholder="Search by phone or name..."
                    value={farmersSearchTerm}
                    onChange={(e) => setFarmersSearchTerm(e.target.value)}
                    className="h-9 pl-9 border-zinc-250 dark:border-zinc-800 text-xs"
                  />
                </div>
              </div>

              {/* Select all / Unselect all toolbar */}
              <div className="flex gap-2 text-xs border-b border-zinc-150 dark:border-zinc-850 pb-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(filteredFarmers)}
                  className="text-emerald-600 dark:text-emerald-450 hover:underline font-semibold cursor-pointer"
                >
                  Select All Filtered
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => handleUnselectAll(filteredFarmers)}
                  className="text-zinc-500 hover:text-zinc-700 hover:underline font-semibold cursor-pointer"
                >
                  Unselect All Filtered
                </button>
              </div>

              {/* Scrollable Farmer List */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/20 dark:bg-zinc-950/20">
                <div className="max-h-60 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-850">
                  {filteredFarmers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-xs">
                      <Check className="h-6 w-6 text-zinc-300 dark:text-zinc-700 mb-1" />
                      <span>No farmers matched search</span>
                    </div>
                  ) : (
                    filteredFarmers.map((farmer) => {
                      const isSelected = selectedFarmers.includes(farmer.phoneNo);
                      return (
                        <div
                          key={farmer.phoneNo}
                          onClick={() => handleFarmerToggle(farmer.phoneNo)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                        >
                          <div className="text-zinc-400 group">
                            {isSelected ? (
                              <CheckSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-150 truncate">
                              {farmer.name || 'Anonymous Farmer'}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-450">
                              {farmer.phoneNo}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-normal py-0">
                            {farmer.language}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Validation Warning */}
              {selectedFarmers.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-red-650 bg-red-50/50 dark:bg-red-950/15 border border-red-200/50 dark:border-red-900/30 p-2.5 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Select at least 1 farmer to assign and publish the survey.</span>
                </div>
              )}

            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/20">
              <Button 
                type="button" 
                variant="outline" 
                disabled={assigning}
                onClick={() => { setIsPublishModalOpen(false); setPublishSurveyTarget(null); }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                disabled={assigning || selectedFarmers.length === 0}
                onClick={handleAssignSurvey}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Assigning...
                  </>
                ) : (
                  'Assign Survey'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ----------------------------------------------------
  // INLINE QUESTION BUILDER RENDERER CARD (GOOGLE FORMS UX)
  // ----------------------------------------------------
  function renderQuestionEditorCard(qId: string | null) {
    if (!activeSurvey) return null;
    const isEditing = qId !== null;

    return (
      <Card className="border-2 border-emerald-550/40 dark:border-emerald-600/30 shadow-lg bg-zinc-50/10 dark:bg-zinc-900/10">
        <CardHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-zinc-850 dark:text-zinc-200">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            {isEditing ? `Edit Question Q${questions.find(q => q.id === qId)?.questionOrder}` : 'Question Builder Card'}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Required:</span>
            <button
              type="button"
              onClick={() => setQuestionRequired(!questionRequired)}
              className={`text-xs px-2.5 py-1 rounded font-semibold border transition-all cursor-pointer ${
                questionRequired 
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400' 
                  : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-650'
              }`}
            >
              {questionRequired ? 'Yes' : 'No'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          
          {/* Question Type and Config fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-450">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  setQuestionType(newType);
                  initializeOptions(newType);
                }}
                className="flex h-10 w-full rounded-md border border-zinc-250 dark:border-zinc-800 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {QUESTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-emerald-50/30 border border-emerald-250/30 rounded-lg p-3 dark:bg-emerald-950/5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-850 dark:text-emerald-450 flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  Multilingual Translation
                </span>
                <p className="text-[9px] text-zinc-400">Autogenerate text translations instantly via AI model.</p>
              </div>
              <Button
                type="button"
                onClick={handleGenerateTranslation}
                disabled={isTranslating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] h-8 px-2.5 cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Translate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Languages tabs input editor */}
          <div className="space-y-3 pt-2">
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              {activeSurvey.languages.map((lang) => {
                const isActive = activeLangTab === lang;
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => setActiveLangTab(lang as any)}
                    className={`py-2 px-3 font-semibold text-xs relative cursor-pointer ${
                      isActive 
                        ? 'text-emerald-600 dark:text-emerald-450 border-b-2 border-emerald-600 dark:border-emerald-450' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {/* TAB PANES */}
            {activeLangTab === 'English' && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">English Question text</label>
                  <Textarea
                    required
                    value={questionEn}
                    onChange={(e) => setQuestionEn(e.target.value)}
                    placeholder="Type the survey question in English..."
                    rows={3}
                    className="border-zinc-250 dark:border-zinc-800"
                  />
                </div>

                {questionType === 'single' && (
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-semibold text-zinc-500 flex items-center justify-between">
                      <span>Options / Choices</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Reorder choices using arrows.</span>
                    </label>
                    <div className="space-y-2">
                      {optionsEn.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-400 w-5">#{i + 1}</span>
                          <Input
                            value={opt}
                            onChange={(e) => handleOptionChange(e.target.value, i, 'en')}
                            placeholder={`Option ${i + 1}`}
                            className="h-9 border-zinc-250 dark:border-zinc-800"
                          />
                          <div className="flex items-center">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => handleMoveOption(i, 'up')}
                              className="p-1 hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={i === optionsEn.length - 1}
                              onClick={() => handleMoveOption(i, 'down')}
                              className="p-1 hover:text-zinc-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={optionsEn.length <= 1}
                            onClick={() => handleRemoveOptionField(i)}
                            className="h-9 w-9 p-0 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOptionField}
                      className="mt-1 text-xs h-8 cursor-pointer border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeLangTab === 'Hindi' && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Hindi Question translation</label>
                  <Textarea
                    value={questionHi}
                    onChange={(e) => setQuestionHi(e.target.value)}
                    placeholder="प्रश्न का हिंदी अनुवाद..."
                    rows={3}
                    className="border-zinc-250 dark:border-zinc-800"
                  />
                </div>

                {questionType === 'single' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500">Choices translation (Hindi)</label>
                    <div className="space-y-2">
                      {optionsEn.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400 w-5">#{i + 1}</span>
                          <Input
                            value={optionsHi[i] || ''}
                            onChange={(e) => handleOptionChange(e.target.value, i, 'hi')}
                            placeholder={opt ? `Hindi translation for: "${opt}"` : `Hindi Option ${i + 1}`}
                            className="h-9 border-zinc-250 dark:border-zinc-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLangTab === 'Spanish' && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Spanish Question translation</label>
                  <Textarea
                    value={questionEs}
                    onChange={(e) => setQuestionEs(e.target.value)}
                    placeholder="Traducción en español..."
                    rows={3}
                    className="border-zinc-250 dark:border-zinc-800"
                  />
                </div>

                {questionType === 'single' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500">Choices translation (Spanish)</label>
                    <div className="space-y-2">
                      {optionsEn.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400 w-5">#{i + 1}</span>
                          <Input
                            value={optionsEs[i] || ''}
                            onChange={(e) => handleOptionChange(e.target.value, i, 'es')}
                            placeholder={opt ? `Spanish translation for: "${opt}"` : `Spanish Option ${i + 1}`}
                            className="h-9 border-zinc-250 dark:border-zinc-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeLangTab === 'Thai' && (
              <div className="space-y-3 animate-in fade-in-50 duration-150">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500">Thai Question translation</label>
                  <Textarea
                    value={questionTh}
                    onChange={(e) => setQuestionTh(e.target.value)}
                    placeholder="คำแปลภาษาไทย..."
                    rows={3}
                    className="border-zinc-250 dark:border-zinc-800"
                  />
                </div>

                {questionType === 'single' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500">Choices translation (Thai)</label>
                    <div className="space-y-2">
                      {optionsEn.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400 w-5">#{i + 1}</span>
                          <Input
                            value={optionsTh[i] || ''}
                            onChange={(e) => handleOptionChange(e.target.value, i, 'th')}
                            placeholder={opt ? `Thai translation for: "${opt}"` : `Thai Option ${i + 1}`}
                            className="h-9 border-zinc-250 dark:border-zinc-800"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </CardContent>
        <CardContent className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50/50 dark:bg-zinc-900/20">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancelQuestionBuild}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSaveQuestion}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            Save Question
          </Button>
        </CardContent>
      </Card>
    );
  }
}
