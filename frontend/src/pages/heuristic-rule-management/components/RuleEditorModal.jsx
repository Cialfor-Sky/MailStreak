import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

const RuleEditorModal = ({ isOpen, onClose, rule, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    severity: '',
    status: 'enabled',
    ruleLogic: '',
    triggerConditions: '',
    updatedBy: 'admin@company.com'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule?.name || '',
        category: rule?.category || '',
        severity: rule?.severity || '',
        status: rule?.status || 'enabled',
        ruleLogic: rule?.ruleLogic || '',
        triggerConditions: rule?.triggerConditions?.join('\n') || '',
        updatedBy: rule?.updatedBy || 'admin@company.com'
      });
    } else {
      setFormData({
        name: '',
        category: '',
        severity: '',
        status: 'enabled',
        ruleLogic: '',
        triggerConditions: '',
        updatedBy: 'admin@company.com'
      });
    }
    setErrors({});
  }, [rule, isOpen]);

  const categoryOptions = [
    { value: 'malware', label: 'Malware' },
    { value: 'phishing', label: 'Phishing' },
    { value: 'spam', label: 'Spam' }
  ];

  const severityOptions = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const statusOptions = [
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!formData?.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData?.severity) {
      newErrors.severity = 'Severity level is required';
    }

    if (!formData?.ruleLogic?.trim()) {
      newErrors.ruleLogic = 'Rule logic is required';
    }

    if (!formData?.triggerConditions?.trim()) {
      newErrors.triggerConditions = 'At least one trigger condition is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const ruleData = {
        ...formData,
        triggerConditions: formData?.triggerConditions?.split('\n')?.filter(c => c?.trim())
      };
      onSave(ruleData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl border border-border w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Icon name="FileEdit" size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              {rule ? 'Edit Rule' : 'Create New Rule'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-smooth"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            <Input
              label="Rule Name"
              value={formData?.name}
              onChange={(e) => handleChange('name', e?.target?.value)}
              placeholder="Enter rule name"
              required
              error={errors?.name}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Category"
                options={categoryOptions}
                value={formData?.category}
                onChange={(value) => handleChange('category', value)}
                placeholder="Select category"
                required
                error={errors?.category}
              />

              <Select
                label="Severity Level"
                options={severityOptions}
                value={formData?.severity}
                onChange={(value) => handleChange('severity', value)}
                placeholder="Select severity"
                required
                error={errors?.severity}
              />

              <Select
                label="Status"
                options={statusOptions}
                value={formData?.status}
                onChange={(value) => handleChange('status', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rule Logic <span className="text-destructive">*</span>
              </label>
              <textarea
                value={formData?.ruleLogic}
                onChange={(e) => handleChange('ruleLogic', e?.target?.value)}
                placeholder="if (email.contains(&quot;pattern&quot;)) { flag_as_threat; }"
                rows={6}
                className={cn(
                  'w-full px-3 py-2 rounded-md bg-muted border text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth',
                  errors?.ruleLogic ? 'border-destructive' : 'border-border'
                )}
              />
              {errors?.ruleLogic && (
                <p className="text-sm text-destructive mt-1">{errors?.ruleLogic}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Trigger Conditions <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground ml-2">(one per line)</span>
              </label>
              <textarea
                value={formData?.triggerConditions}
                onChange={(e) => handleChange('triggerConditions', e?.target?.value)}
                placeholder="Pattern detected\nConfidence score > 80%\nDomain reputation < 30"
                rows={5}
                className={cn(
                  'w-full px-3 py-2 rounded-md bg-muted border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth',
                  errors?.triggerConditions ? 'border-destructive' : 'border-border'
                )}
              />
              {errors?.triggerConditions && (
                <p className="text-sm text-destructive mt-1">{errors?.triggerConditions}</p>
              )}
            </div>

            <div className="bg-accent/10 border border-accent/40 rounded-md p-4">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={16} className="text-accent mt-0.5" />
                <div className="text-xs text-foreground">
                  <p className="font-semibold mb-1">Testing Sandbox</p>
                  <p className="text-muted-foreground">
                    After saving, you can test this rule in the sandbox environment to validate its behavior before deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            iconName="Save"
          >
            {rule ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RuleEditorModal;