import React, { useState, useEffect } from 'react';
import api from '../../../../../../services/api';
import { Loader2, ChevronLeft, ChevronRight, Home, MapPin, Check } from 'lucide-react';
import SelectDropdown from '../../../components/SelectDropdown';
import toast from 'react-hot-toast';

const KARNATAKA_CITIES_REGISTRY = [
    { city: 'KHANAPUR', taluk: 'KHANAPUR', districtName: 'belagavi', pincode: '591302' },
    { city: 'BELAGAVI', taluk: 'BELAGAVI', districtName: 'belagavi', pincode: '590001' },
    { city: 'BELGAUM', taluk: 'BELAGAVI', districtName: 'belagavi', pincode: '590001' },
    { city: 'BENGALURU', taluk: 'BENGALURU NORTH', districtName: 'bengaluru (bangalore) urban', pincode: '560001' },
    { city: 'BANGALORE', taluk: 'BENGALURU NORTH', districtName: 'bengaluru (bangalore) urban', pincode: '560001' },
    { city: 'MYSURU', taluk: 'MYSURU', districtName: 'mysuru', pincode: '570001' },
    { city: 'MYSORE', taluk: 'MYSURU', districtName: 'mysuru', pincode: '570001' },
    { city: 'MANGALURU', taluk: 'MANGALORE', districtName: 'dakshina kannada', pincode: '575001' },
    { city: 'MANGALORE', taluk: 'MANGALORE', districtName: 'dakshina kannada', pincode: '575001' },
    { city: 'DHARWAD', taluk: 'DHARWAD', districtName: 'dharwad', pincode: '580001' },
    { city: 'HUBLI', taluk: 'HUBLI', districtName: 'dharwad', pincode: '580020' },
    { city: 'HUBBALLI', taluk: 'HUBLI', districtName: 'dharwad', pincode: '580020' },
    { city: 'DAVANAGERE', taluk: 'DAVANAGERE', districtName: 'davanagere', pincode: '577001' },
    { city: 'SHIVAMOGGA', taluk: 'SHIMOGA', districtName: 'shivamogga (shimoga)', pincode: '577201' },
    { city: 'SHIMOGA', taluk: 'SHIMOGA', districtName: 'shivamogga (shimoga)', pincode: '577201' },
    { city: 'TUMAKURU', taluk: 'TUMKUR', districtName: 'tumakuru (tumkur)', pincode: '572101' },
    { city: 'TUMKUR', taluk: 'TUMKUR', districtName: 'tumakuru (tumkur)', pincode: '572101' },
    { city: 'BALLARI', taluk: 'BELLARY', districtName: 'ballari', pincode: '583101' },
    { city: 'BELLARY', taluk: 'BELLARY', districtName: 'ballari', pincode: '583101' },
    { city: 'VIJAYAPURA', taluk: 'BIJAPUR', districtName: 'vijayapura', pincode: '586101' },
    { city: 'BIJAPUR', taluk: 'BIJAPUR', districtName: 'vijayapura', pincode: '586101' },
    { city: 'BIDAR', taluk: 'BIDAR', districtName: 'bidar', pincode: '585401' },
    { city: 'HASSAN', taluk: 'HASSAN', districtName: 'hassan', pincode: '573201' },
    { city: 'UDUPI', taluk: 'UDUPI', districtName: 'udupi', pincode: '576101' },
    { city: 'KOLAR', taluk: 'KOLAR', districtName: 'kolar', pincode: '563101' },
    { city: 'MANDYA', taluk: 'MANDYA', districtName: 'mandya', pincode: '571401' },
    { city: 'BAGALKOT', taluk: 'BAGALKOT', districtName: 'bagalkot', pincode: '587101' },
    { city: 'CHITRADURGA', taluk: 'CHITRADURGA', districtName: 'chitradurga', pincode: '577501' },
    { city: 'GADAG', taluk: 'GADAG', districtName: 'gadag', pincode: '582101' },
    { city: 'HAVERI', taluk: 'HAVERI', districtName: 'haveri', pincode: '581110' },
    { city: 'KOPPAL', taluk: 'KOPPAL', districtName: 'koppal', pincode: '583231' },
    { city: 'RAICHUR', taluk: 'RAICHUR', districtName: 'raichur', pincode: '584101' },
    { city: 'YADGIR', taluk: 'YADGIR', districtName: 'yadgir', pincode: '585201' },
    { city: 'CHAMARAJANAGAR', taluk: 'CHAMARAJANAGAR', districtName: 'chamarajanagar', pincode: '571313' },
    { city: 'CHIKKABALLAPUR', taluk: 'CHIKKABALLAPUR', districtName: 'chikkaballapur', pincode: '562101' },
    { city: 'CHIKMAGALUR', taluk: 'CHIKMAGALUR', districtName: 'chikkamagaluru (chikmagalur)', pincode: '577101' },
    { city: 'KARWAR', taluk: 'KARWAR', districtName: 'uttara kannada (karwar)', pincode: '581301' },
    { city: 'RAMANAGARA', taluk: 'RAMANAGARA', districtName: 'ramanagara', pincode: '562159' },
    { city: 'MADIKERI', taluk: 'MADIKERI', districtName: 'kodagu (coorg)', pincode: '571201' }
];

const Step4Address = ({ onNext, onPrev, data, updateData, applicationStatus, readOnly = false }) => {
    const [loading, setLoading] = useState(false);
    const [sameAsCurrent, setSameAsCurrent] = useState(() => {
        if (data.sameAsCurrent !== undefined) {
            return data.sameAsCurrent === true || data.sameAsCurrent === 'true';
        }
        const hasCurrent = data.Address || data.currentAddressLine1;
        const hasPermanent = data.permanentAddress || data.permanentAddressLine1;
        if (hasCurrent && hasCurrent === hasPermanent) {
            const hasCurrentCity = data.City || data.currentCity;
            const hasPermanentCity = data.permanentCity;
            const hasCurrentPincode = data.Pincode || data.currentPincode;
            const hasPermanentPincode = data.permanentPincode;
            if (hasCurrentCity && hasCurrentCity === hasPermanentCity && hasCurrentPincode && hasCurrentPincode === hasPermanentPincode) {
                return true;
            }
        }
        return false;
    });
    const [districts, setDistricts] = useState([]);
    
    const [lastPincode, setLastPincode] = useState('');
    const [lastPermanentPincode, setLastPermanentPincode] = useState('');

    const [manuallyEdited, setManuallyEdited] = useState({
        City: false,
        Taluk: false,
        DistrictId: false,
        Pincode: false,
        permanentCity: false,
        permanentTaluk: false,
        permanentDistrictId: false,
        permanentPincode: false
    });

    const cityTimeoutRef = React.useRef(null);
    const permanentCityTimeoutRef = React.useRef(null);

    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const res = await api.get('/address/districts');
                if (res.data.success) {
                    setDistricts(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch districts:", error);
                toast.error("Could not load districts list", { id: 'fetch-districts-error' });
            }
        };
        fetchDistricts();
        
        return () => {
            if (cityTimeoutRef.current) clearTimeout(cityTimeoutRef.current);
            if (permanentCityTimeoutRef.current) clearTimeout(permanentCityTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (data.sameAsCurrent !== undefined) {
            setSameAsCurrent(data.sameAsCurrent === true || data.sameAsCurrent === 'true');
        }
    }, [data.sameAsCurrent]);

    // Auto-lookup pincode on data load to populate Taluk and District
    useEffect(() => {
        const pincode = data.Pincode || data.currentPincode;
        if (pincode && /^\d{6}$/.test(pincode) && pincode !== lastPincode && districts.length > 0) {
            setLastPincode(pincode);
            lookupPincode(pincode, false);
        }
    }, [data.Pincode, data.currentPincode, districts]);

    useEffect(() => {
        const permPincode = data.permanentPincode;
        if (permPincode && /^\d{6}$/.test(permPincode) && permPincode !== lastPermanentPincode && districts.length > 0) {
            setLastPermanentPincode(permPincode);
            lookupPincode(permPincode, true);
        }
    }, [data.permanentPincode, districts]);

    const matchDistrict = (districtName) => {
        if (!districtName) return '';
        const normName = districtName.toLowerCase().replace(/\s+/g, '');
        const found = districts.find(d => {
            const normD = d.name.toLowerCase().replace(/\s+/g, '');
            return normD.includes(normName) || normName.includes(normD);
        });
        return found ? found.id : '';
    };

    const autofillCurrent = (fields) => {
        const updates = {};
        if (fields.city && (!manuallyEdited.City || !data.City)) {
            updates.City = fields.city.toUpperCase();
        }
        if (fields.taluk && (!manuallyEdited.Taluk || !data.Taluk)) {
            updates.Taluk = fields.taluk.toUpperCase();
        }
        if (fields.district && (!manuallyEdited.DistrictId || !data.DistrictId)) {
            updates.DistrictId = matchDistrict(fields.district);
        }
        if (fields.pincode && (!manuallyEdited.Pincode || !data.Pincode)) {
            updates.Pincode = fields.pincode;
            setLastPincode(fields.pincode);
        }
        updateData(updates);
    };

    const autofillPermanent = (fields) => {
        const updates = {};
        if (fields.city && (!manuallyEdited.permanentCity || !data.permanentCity)) {
            updates.permanentCity = fields.city.toUpperCase();
        }
        if (fields.taluk && (!manuallyEdited.permanentTaluk || !data.permanentTaluk)) {
            updates.permanentTaluk = fields.taluk.toUpperCase();
        }
        if (fields.district && (!manuallyEdited.permanentDistrictId || !data.permanentDistrictId)) {
            updates.permanentDistrictId = matchDistrict(fields.district);
        }
        if (fields.pincode && (!manuallyEdited.permanentPincode || !data.permanentPincode)) {
            updates.permanentPincode = fields.pincode;
            setLastPermanentPincode(fields.pincode);
        }
        updateData(updates);
    };

    const lookupPincode = async (pincode, isPermanent) => {
        if (!/^\d{6}$/.test(pincode)) return;

        // 1. Check local registry first
        const matchedLocal = KARNATAKA_CITIES_REGISTRY.find(item => item.pincode === pincode);
        if (matchedLocal) {
            const dataFields = {
                city: matchedLocal.city,
                taluk: matchedLocal.taluk,
                district: matchedLocal.districtName
            };
            if (isPermanent) {
                autofillPermanent(dataFields);
            } else {
                autofillCurrent(dataFields);
            }
            return;
        }

        // 2. Fetch from Postal API
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const resData = await response.json();
            if (resData && resData[0] && resData[0].Status === 'Success' && resData[0].PostOffice) {
                const po = resData[0].PostOffice[0];
                const dataFields = {
                    city: po.Name,
                    taluk: po.Block || po.Taluk,
                    district: po.District
                };
                if (isPermanent) {
                    autofillPermanent(dataFields);
                } else {
                    autofillCurrent(dataFields);
                }
            }
        } catch (err) {
            // silently fail
        }
    };

    const lookupCity = async (cityName, isPermanent) => {
        if (!cityName || cityName.length < 3) return;
        const searchCity = cityName.toUpperCase().trim();

        // 1. Check local registry first
        const matchedLocal = KARNATAKA_CITIES_REGISTRY.find(item => item.city === searchCity);
        if (matchedLocal) {
            const dataFields = {
                taluk: matchedLocal.taluk,
                district: matchedLocal.districtName,
                pincode: matchedLocal.pincode
            };
            if (isPermanent) {
                autofillPermanent(dataFields);
            } else {
                autofillCurrent(dataFields);
            }
            return;
        }

        // 2. Fetch from Postal API
        try {
            const response = await fetch(`https://api.postalpincode.in/postoffice/${searchCity}`);
            const resData = await response.json();
            if (resData && resData[0] && resData[0].Status === 'Success' && resData[0].PostOffice) {
                const po = resData[0].PostOffice[0];
                const dataFields = {
                    pincode: po.Pincode,
                    taluk: po.Block || po.Taluk,
                    district: po.District
                };
                if (isPermanent) {
                    autofillPermanent(dataFields);
                } else {
                    autofillCurrent(dataFields);
                }
            }
        } catch (err) {
            // silently fail
        }
    };

    const handleCityBlur = (e) => {
        const { name, value } = e.target;
        const isPermanent = name === 'permanentCity';
        
        if (isPermanent) {
            if (permanentCityTimeoutRef.current) clearTimeout(permanentCityTimeoutRef.current);
        } else {
            if (cityTimeoutRef.current) clearTimeout(cityTimeoutRef.current);
        }
        
        lookupCity(value, isPermanent);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (readOnly) {
            onNext();
            return;
        }

        setLoading(true);
        try {
            const payload = {
                currentAddressLine1: data.Address || data.currentAddressLine1,
                currentCity: data.City || data.currentCity,
                currentState: 'Karnataka',
                currentPincode: data.Pincode || data.currentPincode,
                currentCountry: 'India',
                sameAsCurrent,
                permanentAddressLine1: sameAsCurrent ? (data.Address || data.currentAddressLine1) : (data.permanentAddress || data.permanentAddressLine1),
                permanentCity: sameAsCurrent ? (data.City || data.currentCity) : (data.permanentCity || data.permanentCity),
                permanentState: 'Karnataka',
                permanentPincode: sameAsCurrent ? (data.Pincode || data.currentPincode) : (data.permanentPincode || data.permanentPincode),
                permanentCountry: 'India',
            };

            const res = await api.put('/student/address', payload);
            if (res.data.success) {
                toast.success('Address details saved!');
                updateData({ sameAsCurrent });
                onNext();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to save address details');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked;
        setSameAsCurrent(checked);
        
        const updates = { sameAsCurrent: checked };
        if (checked) {
            updates.permanentAddress = data.Address || data.currentAddressLine1 || '';
            updates.permanentCity = data.City || data.currentCity || '';
            updates.permanentTaluk = data.Taluk || '';
            updates.permanentDistrictId = data.DistrictId || '';
            updates.permanentPincode = data.Pincode || data.currentPincode || '';
        }
        updateData(updates);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateData({ [name]: value });

        setManuallyEdited(prev => ({ ...prev, [name]: true }));

        if (value === '') {
            setManuallyEdited(prev => ({ ...prev, [name]: false }));
        }

        if (name === 'City') {
            if (cityTimeoutRef.current) clearTimeout(cityTimeoutRef.current);
            if (value.length >= 3) {
                cityTimeoutRef.current = setTimeout(() => {
                    lookupCity(value, false);
                }, 500);
            }
        } else if (name === 'permanentCity') {
            if (permanentCityTimeoutRef.current) clearTimeout(permanentCityTimeoutRef.current);
            if (value.length >= 3) {
                permanentCityTimeoutRef.current = setTimeout(() => {
                    lookupCity(value, true);
                }, 500);
            }
        }

        if (name === 'Pincode') {
            if (value.length === 6 && value !== lastPincode) {
                setManuallyEdited(prev => ({
                    ...prev,
                    City: false,
                    Taluk: false,
                    DistrictId: false
                }));
                setLastPincode(value);
                lookupPincode(value, false);
            }
        } else if (name === 'permanentPincode') {
            if (value.length === 6 && value !== lastPermanentPincode) {
                setManuallyEdited(prev => ({
                    ...prev,
                    permanentCity: false,
                    permanentTaluk: false,
                    permanentDistrictId: false
                }));
                setLastPermanentPincode(value);
                lookupPincode(value, true);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in flex flex-col">
            <fieldset disabled={readOnly} className="space-y-8 flex flex-col p-0 m-0 border-0 w-full">
            {/* Current Address */}
            <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Current Address</h2>
                        <p className="text-xs text-slate-500">Present residential details</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Street Address <span className="text-red-500">*</span></label>
                        <textarea required name="Address" rows="3" className="input-premium py-3 h-auto min-h-[80px] uppercase" value={data.Address || data.currentAddressLine1 || ''} onChange={handleChange} placeholder="Enter street address" />
                        {!(data.Address || data.currentAddressLine1) && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">City / Village <span className="text-red-500">*</span></label>
                        <input required type="text" name="City" className="input-premium h-11 uppercase" value={data.City || data.currentCity || ''} onChange={handleChange} onBlur={handleCityBlur} placeholder="Enter city or village" />
                        {!(data.City || data.currentCity) && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                        <p className="text-[10px] text-blue-600 font-medium">* Fill pincode to automatically detect city, taluk, and district.</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Taluk <span className="text-red-500">*</span></label>
                        <input required type="text" name="Taluk" className="input-premium h-11 uppercase" value={data.Taluk || ''} onChange={handleChange} placeholder="Enter taluk" />
                        {!data.Taluk && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">District <span className="text-red-500">*</span></label>
                        <SelectDropdown
                            id="DistrictId" name="DistrictId" required
                            value={data.DistrictId || ''}
                            onChange={(val) => handleChange({ target: { name: 'DistrictId', value: val } })}
                            placeholder="Select district..."
                            options={districts.map(d => ({ value: d.id, label: d.name }))}
                        />
                        {!data.DistrictId && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Pincode <span className="text-red-500">*</span></label>
                        <input required type="text" pattern="[0-9]{6}" name="Pincode" className="input-premium h-11" value={data.Pincode || data.currentPincode || ''} onChange={handleChange} placeholder="Enter pincode" />
                        {!(data.Pincode || data.currentPincode) && applicationStatus === 'REJECTED' && (
                            <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                        )}
                        <p className="text-[10px] text-blue-600 font-medium">* Entering pincode will autofill city, taluk, and district.</p>
                    </div>
                </div>
            </div>

            {/* Permanent Address */}
            <div className="space-y-5 pt-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                            <Home size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Permanent Address</h2>
                            <p className="text-xs text-slate-500">Permanent home address</p>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <input
                            type="checkbox"
                            checked={sameAsCurrent}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Same as Current Address</span>
                    </label>
                </div>

                {!sameAsCurrent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
                        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Street Address <span className="text-red-500">*</span></label>
                            <textarea required name="permanentAddress" rows="3" className="input-premium py-3 h-auto min-h-[80px] uppercase" value={data.permanentAddress || data.permanentAddressLine1 || ''} onChange={handleChange} placeholder="Enter street address" />
                            {!(data.permanentAddress || data.permanentAddressLine1) && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">City / Village <span className="text-red-500">*</span></label>
                            <input required type="text" name="permanentCity" className="input-premium h-11 uppercase" value={data.permanentCity || data.permanentCity || ''} onChange={handleChange} onBlur={handleCityBlur} placeholder="Enter city or village" />
                            {!(data.permanentCity) && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                            )}
                            <p className="text-[10px] text-blue-600 font-medium">* Fill pincode to automatically detect city, taluk, and district.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Taluk <span className="text-red-500">*</span></label>
                            <input required type="text" name="permanentTaluk" className="input-premium h-11 uppercase" value={data.permanentTaluk || ''} onChange={handleChange} placeholder="Enter taluk" />
                            {!data.permanentTaluk && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                            )}
                        </div>
                         <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">District <span className="text-red-500">*</span></label>
                            <SelectDropdown
                                id="permanentDistrictId" name="permanentDistrictId" required
                                value={data.permanentDistrictId || ''}
                                onChange={(val) => handleChange({ target: { name: 'permanentDistrictId', value: val } })}
                                placeholder="Select district..."
                                options={districts.map(d => ({ value: d.id, label: d.name }))}
                            />
                            {!data.permanentDistrictId && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Pincode <span className="text-red-500">*</span></label>
                            <input required type="text" pattern="[0-9]{6}" name="permanentPincode" className="input-premium h-11" value={data.permanentPincode || data.permanentPincode || ''} onChange={handleChange} placeholder="Enter pincode" />
                            {!(data.permanentPincode) && applicationStatus === 'REJECTED' && (
                                <p className="text-red-500 text-[11px] font-bold mt-1">Please fill this field mandatorily</p>
                            )}
                            <p className="text-[10px] text-blue-600 font-medium">* Entering pincode will autofill city, taluk, and district.</p>
                        </div>
                    </div>
                )}

                {sameAsCurrent && (
                    <div className="bg-primary-50 rounded-lg p-6 text-center border border-primary-100 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white text-primary-600 flex items-center justify-center border border-primary-100">
                            <Home size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Same as Current Address</p>
                            <p className="text-xs text-slate-500">Permanent address will be automatically synced.</p>
                        </div>
                    </div>
                )}
            </div>
            </fieldset>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md p-3 sm:p-0 -mx-4 -mb-4 sm:mx-0 sm:mb-0 sm:static sm:bg-transparent z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sm:shadow-none">
                <button type="button" onClick={onPrev} className="btn-secondary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                    <ChevronLeft size={16} /> Back
                </button>
                <button type="submit" id="bottom-submit-btn" disabled={loading} className="btn-primary w-full sm:w-auto min-h-[48px] sm:min-h-[44px] h-11 px-6 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>Save & Continue <ChevronRight size={16} /></>
                    )}
                </button>
            </div>
        </form>
    );
};

export default Step4Address;
