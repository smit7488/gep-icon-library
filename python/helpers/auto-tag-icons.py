#!/usr/bin/env python3
"""
Auto-Tag Icons Script
Analyzes SVG icons and automatically generates relevant tags based on:
- Icon ID/name patterns
- SVG visual characteristics (paths, shapes)
- Categories
- Common icon use cases
"""

import json
import re
from typing import List, Dict, Set
from pathlib import Path


class IconTagger:
    def __init__(self):
        """Initialize the tagger with comprehensive tag dictionaries."""
        
        # Keyword-based tag mappings
        self.keyword_tags = {
            # Location & Navigation
            'location': ['place', 'location', 'destination', 'map', 'navigation', 'pin'],
            'place': ['place', 'location', 'destination', 'map', 'navigation', 'pin'],
            'map': ['map', 'navigation', 'location', 'geography', 'directions'],
            'pin': ['pin', 'marker', 'location', 'place', 'destination'],
            'marker': ['marker', 'pin', 'location', 'place'],
            'destination': ['destination', 'location', 'place', 'travel'],
            'navigate': ['navigation', 'directions', 'route', 'map'],
            'direction': ['directions', 'navigation', 'route', 'arrow'],
            'compass': ['compass', 'navigation', 'direction', 'orientation'],
            
            # Communication
            'phone': ['phone', 'call', 'telephone', 'communication', 'contact'],
            'call': ['call', 'phone', 'telephone', 'communication'],
            'message': ['message', 'chat', 'communication', 'text', 'conversation'],
            'chat': ['chat', 'message', 'communication', 'conversation', 'talk'],
            'email': ['email', 'mail', 'message', 'communication', 'letter'],
            'mail': ['mail', 'email', 'message', 'communication', 'letter', 'post'],
            'envelope': ['envelope', 'mail', 'email', 'message', 'letter'],
            'notification': ['notification', 'alert', 'bell', 'reminder', 'notice'],
            'alert': ['alert', 'notification', 'warning', 'attention', 'important'],
            'bell': ['bell', 'notification', 'alert', 'alarm', 'reminder'],
            
            # Actions & Interface
            'search': ['search', 'find', 'magnify', 'lookup', 'discover'],
            'find': ['find', 'search', 'locate', 'discover'],
            'add': ['add', 'plus', 'new', 'create', 'insert'],
            'plus': ['plus', 'add', 'new', 'create', 'increase'],
            'delete': ['delete', 'remove', 'trash', 'discard', 'erase'],
            'remove': ['remove', 'delete', 'trash', 'discard'],
            'trash': ['trash', 'delete', 'remove', 'bin', 'discard'],
            'edit': ['edit', 'modify', 'change', 'update', 'pencil'],
            'pencil': ['pencil', 'edit', 'write', 'draw', 'modify'],
            'save': ['save', 'disk', 'store', 'preserve', 'keep'],
            'download': ['download', 'save', 'import', 'get', 'retrieve'],
            'upload': ['upload', 'export', 'send', 'transfer', 'share'],
            'share': ['share', 'send', 'distribute', 'export', 'publish'],
            'copy': ['copy', 'duplicate', 'clone', 'replicate'],
            'paste': ['paste', 'insert', 'place'],
            'cut': ['cut', 'remove', 'move', 'scissors'],
            'close': ['close', 'exit', 'dismiss', 'cancel', 'x'],
            'cancel': ['cancel', 'close', 'dismiss', 'abort', 'stop'],
            'check': ['check', 'confirm', 'done', 'complete', 'success', 'verified'],
            'tick': ['tick', 'check', 'done', 'complete', 'verified'],
            'done': ['done', 'complete', 'finished', 'check', 'success'],
            'success': ['success', 'complete', 'done', 'check', 'approved'],
            'error': ['error', 'warning', 'alert', 'problem', 'issue'],
            'warning': ['warning', 'alert', 'caution', 'attention', 'notice'],
            'info': ['info', 'information', 'help', 'about', 'details'],
            'information': ['information', 'info', 'help', 'details', 'about'],
            'help': ['help', 'support', 'question', 'info', 'assistance'],
            'question': ['question', 'help', 'info', 'query', 'ask'],
            
            # Navigation & Movement
            'arrow': ['arrow', 'direction', 'pointer', 'navigation'],
            'up': ['up', 'arrow', 'increase', 'ascending', 'north'],
            'down': ['down', 'arrow', 'decrease', 'descending', 'south'],
            'left': ['left', 'arrow', 'back', 'previous', 'west'],
            'right': ['right', 'arrow', 'forward', 'next', 'east'],
            'next': ['next', 'forward', 'arrow', 'continue', 'proceed'],
            'previous': ['previous', 'back', 'arrow', 'return'],
            'back': ['back', 'previous', 'return', 'arrow', 'undo'],
            'forward': ['forward', 'next', 'arrow', 'continue', 'proceed'],
            'home': ['home', 'house', 'main', 'start', 'beginning'],
            'menu': ['menu', 'navigation', 'list', 'options', 'hamburger'],
            'hamburger': ['hamburger', 'menu', 'navigation', 'options'],
            'more': ['more', 'options', 'dots', 'menu', 'additional'],
            'dots': ['dots', 'more', 'options', 'menu', 'ellipsis'],
            
            # Media & Content
            'image': ['image', 'picture', 'photo', 'media', 'gallery'],
            'picture': ['picture', 'image', 'photo', 'media'],
            'photo': ['photo', 'image', 'picture', 'camera', 'media'],
            'camera': ['camera', 'photo', 'picture', 'capture', 'media'],
            'video': ['video', 'media', 'play', 'movie', 'film'],
            'play': ['play', 'video', 'media', 'start', 'audio'],
            'pause': ['pause', 'stop', 'media', 'video', 'audio'],
            'stop': ['stop', 'pause', 'media', 'end', 'cancel'],
            'music': ['music', 'audio', 'sound', 'media', 'song'],
            'audio': ['audio', 'sound', 'music', 'media', 'volume'],
            'volume': ['volume', 'audio', 'sound', 'speaker', 'music'],
            'speaker': ['speaker', 'audio', 'sound', 'volume', 'music'],
            'mute': ['mute', 'silence', 'volume', 'audio', 'quiet'],
            
            # Files & Documents
            'file': ['file', 'document', 'paper', 'page', 'content'],
            'document': ['document', 'file', 'paper', 'page', 'text'],
            'folder': ['folder', 'directory', 'files', 'organize', 'storage'],
            'archive': ['archive', 'storage', 'folder', 'compress', 'zip'],
            'page': ['page', 'document', 'paper', 'sheet', 'file'],
            'paper': ['paper', 'document', 'page', 'sheet', 'file'],
            'pdf': ['pdf', 'document', 'file', 'adobe', 'portable'],
            'zip': ['zip', 'compress', 'archive', 'package', 'bundle'],
            
            # Users & People
            'user': ['user', 'person', 'profile', 'account', 'avatar'],
            'person': ['person', 'user', 'human', 'people', 'profile'],
            'people': ['people', 'users', 'group', 'team', 'community'],
            'team': ['team', 'group', 'people', 'collaboration', 'users'],
            'group': ['group', 'team', 'people', 'collective', 'users'],
            'profile': ['profile', 'user', 'account', 'person', 'avatar'],
            'account': ['account', 'user', 'profile', 'login', 'credentials'],
            'avatar': ['avatar', 'profile', 'user', 'picture', 'icon'],
            
            # Security & Privacy
            'lock': ['lock', 'secure', 'privacy', 'protected', 'security'],
            'unlock': ['unlock', 'open', 'access', 'unsecure'],
            'secure': ['secure', 'lock', 'safe', 'protected', 'security'],
            'security': ['security', 'secure', 'lock', 'protected', 'safe'],
            'key': ['key', 'password', 'access', 'unlock', 'security'],
            'password': ['password', 'key', 'security', 'credentials', 'login'],
            'shield': ['shield', 'protect', 'security', 'safe', 'defense'],
            'protect': ['protect', 'shield', 'security', 'safe', 'guard'],
            
            # Time & Calendar
            'time': ['time', 'clock', 'schedule', 'hours', 'duration'],
            'clock': ['clock', 'time', 'hours', 'schedule', 'watch'],
            'calendar': ['calendar', 'date', 'schedule', 'event', 'planner'],
            'date': ['date', 'calendar', 'day', 'schedule', 'time'],
            'schedule': ['schedule', 'calendar', 'plan', 'time', 'agenda'],
            'event': ['event', 'calendar', 'schedule', 'meeting', 'appointment'],
            'alarm': ['alarm', 'clock', 'alert', 'reminder', 'notification'],
            'timer': ['timer', 'clock', 'countdown', 'stopwatch', 'time'],
            
            # Shopping & Commerce
            'cart': ['cart', 'shopping', 'basket', 'purchase', 'buy'],
            'shopping': ['shopping', 'cart', 'buy', 'purchase', 'store'],
            'basket': ['basket', 'cart', 'shopping', 'buy', 'purchase'],
            'buy': ['buy', 'purchase', 'shopping', 'cart', 'payment'],
            'purchase': ['purchase', 'buy', 'shopping', 'payment', 'cart'],
            'payment': ['payment', 'pay', 'money', 'transaction', 'purchase'],
            'money': ['money', 'cash', 'payment', 'currency', 'finance'],
            'credit': ['credit', 'card', 'payment', 'money', 'finance'],
            'card': ['card', 'credit', 'payment', 'money', 'debit'],
            'dollar': ['dollar', 'money', 'currency', 'payment', 'cash'],
            'price': ['price', 'cost', 'money', 'payment', 'tag'],
            'tag': ['tag', 'label', 'price', 'category', 'mark'],
            
            # Settings & Configuration
            'settings': ['settings', 'configuration', 'preferences', 'options', 'gear'],
            'gear': ['gear', 'settings', 'configuration', 'options', 'cog'],
            'cog': ['cog', 'gear', 'settings', 'configuration', 'mechanical'],
            'options': ['options', 'settings', 'preferences', 'configuration', 'menu'],
            'preferences': ['preferences', 'settings', 'options', 'configuration'],
            'tool': ['tool', 'wrench', 'settings', 'repair', 'fix'],
            'wrench': ['wrench', 'tool', 'settings', 'repair', 'fix'],
            
            # Weather & Nature
            'weather': ['weather', 'climate', 'forecast', 'conditions', 'sky'],
            'sun': ['sun', 'sunny', 'weather', 'day', 'bright'],
            'moon': ['moon', 'night', 'lunar', 'weather', 'dark'],
            'cloud': ['cloud', 'weather', 'sky', 'cloudy', 'overcast'],
            'rain': ['rain', 'weather', 'wet', 'precipitation', 'shower'],
            'snow': ['snow', 'weather', 'winter', 'cold', 'precipitation'],
            'wind': ['wind', 'weather', 'breeze', 'air', 'windy'],
            'storm': ['storm', 'weather', 'thunder', 'lightning', 'severe'],
            'star': ['star', 'favorite', 'rating', 'celestial', 'night'],
            'heart': ['heart', 'love', 'like', 'favorite', 'health'],
            'favorite': ['favorite', 'star', 'like', 'bookmark', 'preferred'],
            'like': ['like', 'favorite', 'heart', 'approve', 'thumbs'],
            
            # Business & Office
            'business': ['business', 'work', 'office', 'corporate', 'professional'],
            'office': ['office', 'business', 'work', 'workspace', 'desk'],
            'work': ['work', 'job', 'business', 'office', 'professional'],
            'briefcase': ['briefcase', 'business', 'work', 'bag', 'office'],
            'chart': ['chart', 'graph', 'analytics', 'data', 'statistics'],
            'graph': ['graph', 'chart', 'analytics', 'data', 'statistics'],
            'analytics': ['analytics', 'data', 'chart', 'graph', 'statistics'],
            'data': ['data', 'information', 'analytics', 'statistics', 'database'],
            'statistics': ['statistics', 'data', 'analytics', 'chart', 'graph'],
            'report': ['report', 'document', 'analysis', 'data', 'chart'],
            'presentation': ['presentation', 'slides', 'meeting', 'display', 'pitch'],
            
            # Health & Medical
            'health': ['health', 'medical', 'healthcare', 'wellness', 'medicine'],
            'medical': ['medical', 'health', 'healthcare', 'medicine', 'doctor'],
            'healthcare': ['healthcare', 'health', 'medical', 'medicine', 'care'],
            'medicine': ['medicine', 'medical', 'health', 'drug', 'pill'],
            'hospital': ['hospital', 'medical', 'health', 'clinic', 'care'],
            'doctor': ['doctor', 'medical', 'physician', 'health', 'healthcare'],
            'nurse': ['nurse', 'medical', 'healthcare', 'health', 'care'],
            'pill': ['pill', 'medicine', 'drug', 'medication', 'tablet'],
            'drug': ['drug', 'medicine', 'pill', 'medication', 'pharmaceutical'],
            
            # Dental (specific to this icon set)
            'dental': ['dental', 'tooth', 'dentist', 'oral', 'teeth'],
            'tooth': ['tooth', 'dental', 'teeth', 'dentist', 'oral'],
            'teeth': ['teeth', 'dental', 'tooth', 'dentist', 'oral'],
            'dentist': ['dentist', 'dental', 'tooth', 'oral', 'healthcare'],
            'bur': ['bur', 'dental', 'drill', 'tool', 'instrument'],
            'drill': ['drill', 'tool', 'bore', 'dental', 'equipment'],
            
            # Medical Supplies & Equipment
            'suture': ['suture', 'stitch', 'wound', 'surgical', 'closure'],
            'sutures': ['sutures', 'stitches', 'wound', 'surgical', 'closure'],
            'adhesive': ['adhesive', 'glue', 'bonding', 'stick', 'attachment'],
            'adhesives': ['adhesives', 'glue', 'bonding', 'stick', 'attachment'],
            'staple': ['staple', 'fastener', 'clip', 'surgical', 'closure'],
            'staples': ['staples', 'fasteners', 'clips', 'surgical', 'closure'],
            'brace': ['brace', 'support', 'orthopedic', 'stabilization', 'immobilize'],
            'braces': ['braces', 'supports', 'orthopedic', 'stabilization', 'immobilize'],
            'support': ['support', 'brace', 'assist', 'stabilize', 'orthopedic'],
            'supports': ['supports', 'braces', 'assist', 'stabilize', 'orthopedic'],
            'uniform': ['uniform', 'apparel', 'clothing', 'scrubs', 'staff'],
            'uniforms': ['uniforms', 'apparel', 'clothing', 'scrubs', 'staff'],
            'staff': ['staff', 'personnel', 'team', 'employee', 'worker'],
            
            # Dental Burs & Tools
            'diamond': ['diamond', 'bur', 'dental', 'abrasive', 'cutting'],
            'carbide': ['carbide', 'bur', 'dental', 'cutting', 'tool'],
            'steel': ['steel', 'bur', 'metal', 'dental', 'tool'],
            'file': ['file', 'endodontic', 'root', 'canal', 'dental'],
            'files': ['files', 'endodontic', 'root', 'canal', 'dental'],
            'curette': ['curette', 'scaler', 'dental', 'periodontal', 'cleaning'],
            'curettes': ['curettes', 'scalers', 'dental', 'periodontal', 'cleaning'],
            'scaler': ['scaler', 'curette', 'dental', 'periodontal', 'cleaning'],
            'scalers': ['scalers', 'curettes', 'dental', 'periodontal', 'cleaning'],
            
            # Laboratory & Analysis
            'chemistry': ['chemistry', 'lab', 'analysis', 'testing', 'diagnostic'],
            'immunology': ['immunology', 'immune', 'antibody', 'testing', 'diagnostic'],
            'hematology': ['hematology', 'blood', 'testing', 'lab', 'diagnostic'],
            'ultrasound': ['ultrasound', 'imaging', 'diagnostic', 'sonography', 'medical'],
            'analyzer': ['analyzer', 'testing', 'diagnostic', 'lab', 'clinical'],
            
            # Furniture & Equipment
            'table': ['table', 'furniture', 'surface', 'exam', 'procedure'],
            'tables': ['tables', 'furniture', 'surface', 'exam', 'procedure'],
            'cabinet': ['cabinet', 'storage', 'furniture', 'organization', 'casework'],
            'cabinetry': ['cabinetry', 'cabinet', 'storage', 'furniture', 'casework'],
            'casework': ['casework', 'cabinetry', 'cabinet', 'storage', 'furniture'],
            'stool': ['stool', 'seating', 'furniture', 'chair', 'mobile'],
            'stools': ['stools', 'seating', 'furniture', 'chairs', 'mobile'],
            'chair': ['chair', 'seating', 'furniture', 'patient', 'dental'],
            'chairs': ['chairs', 'seating', 'furniture', 'patient', 'dental'],
            'recliner': ['recliner', 'chair', 'seating', 'patient', 'dental'],
            'recliners': ['recliners', 'chairs', 'seating', 'patient', 'dental'],
            
            # Surgical & Procedural
            'forceps': ['forceps', 'clamp', 'surgical', 'instrument', 'grasp'],
            'surgery': ['surgery', 'surgical', 'operation', 'procedure', 'medical'],
            'surgical': ['surgical', 'surgery', 'operation', 'procedure', 'medical'],
            'periodontal': ['periodontal', 'gum', 'dental', 'tissue', 'oral'],
            'composite': ['composite', 'filling', 'restoration', 'dental', 'resin'],
            'composites': ['composites', 'fillings', 'restoration', 'dental', 'resin'],
            'restorative': ['restorative', 'restoration', 'dental', 'repair', 'filling'],
            'restoration': ['restoration', 'restorative', 'dental', 'repair', 'filling'],
            
            # Wound Care & Bandaging
            'bandage': ['bandage', 'dressing', 'wound', 'gauze', 'cover'],
            'bandages': ['bandages', 'dressings', 'wound', 'gauze', 'cover'],
            'tape': ['tape', 'adhesive', 'bandage', 'medical', 'securing'],
            'tapes': ['tapes', 'adhesive', 'bandages', 'medical', 'securing'],
            'dressing': ['dressing', 'bandage', 'wound', 'gauze', 'cover'],
            'dressings': ['dressings', 'bandages', 'wound', 'gauze', 'cover'],
            'sponge': ['sponge', 'gauze', 'absorbent', 'surgical', 'cleaning'],
            'sponges': ['sponges', 'gauze', 'absorbent', 'surgical', 'cleaning'],
            
            # Emergency & EMS
            'ems': ['ems', 'emergency', 'ambulance', 'paramedic', 'response'],
            'emergency': ['emergency', 'urgent', 'critical', 'ems', 'rescue'],
            'oxygen': ['oxygen', 'respiratory', 'breathing', 'gas', 'medical'],
            'gas': ['gas', 'oxygen', 'anesthesia', 'medical', 'breathing'],
            'defibrillator': ['defibrillator', 'aed', 'cardiac', 'emergency', 'heart'],
            'defibrillators': ['defibrillators', 'aed', 'cardiac', 'emergency', 'heart'],
            
            # Anesthesia & Pain Management
            'anesthesia': ['anesthesia', 'sedation', 'pain', 'numbing', 'medical'],
            'anesthetic': ['anesthetic', 'numbing', 'pain', 'local', 'topical'],
            'anesthetics': ['anesthetics', 'numbing', 'pain', 'local', 'topical'],
            'sedation': ['sedation', 'anesthesia', 'conscious', 'calming', 'medical'],
            
            # Scissors & Cutting Tools
            'scissor': ['scissor', 'cut', 'surgical', 'instrument', 'shear'],
            'scissors': ['scissors', 'cut', 'surgical', 'instrument', 'shears'],
            'shear': ['shear', 'cut', 'scissors', 'surgical', 'instrument'],
            'shears': ['shears', 'cut', 'scissors', 'surgical', 'instrument'],
            'scalpel': ['scalpel', 'blade', 'surgical', 'cutting', 'knife'],
            'scalpels': ['scalpels', 'blades', 'surgical', 'cutting', 'knives'],
            'blade': ['blade', 'scalpel', 'cutting', 'surgical', 'sharp'],
            'blades': ['blades', 'scalpels', 'cutting', 'surgical', 'sharp'],
            
            # Discs & Polishing
            'disc': ['disc', 'disk', 'polishing', 'abrasive', 'dental'],
            'discs': ['discs', 'disks', 'polishing', 'abrasive', 'dental'],
            'disk': ['disk', 'disc', 'polishing', 'abrasive', 'dental'],
            'block': ['block', 'milling', 'restoration', 'dental', 'material'],
            'blocks': ['blocks', 'milling', 'restoration', 'dental', 'material'],
            'polisher': ['polisher', 'finishing', 'dental', 'abrasive', 'smooth'],
            'polishers': ['polishers', 'finishing', 'dental', 'abrasive', 'smooth'],
            'polishing': ['polishing', 'finishing', 'abrasive', 'smooth', 'dental'],
            
            # Vital Signs & Monitoring
            'blood': ['blood', 'pressure', 'vital', 'monitor', 'medical'],
            'pressure': ['pressure', 'blood', 'vital', 'monitor', 'bp'],
            'vital': ['vital', 'signs', 'monitor', 'health', 'medical'],
            'monitor': ['monitor', 'vital', 'signs', 'tracking', 'display'],
            'pulse': ['pulse', 'heart', 'rate', 'vital', 'oximeter'],
            'oximeter': ['oximeter', 'pulse', 'oxygen', 'saturation', 'monitoring'],
            'thermometer': ['thermometer', 'temperature', 'vital', 'fever', 'medical'],
            'thermometers': ['thermometers', 'temperature', 'vital', 'fever', 'medical'],
            'stethoscope': ['stethoscope', 'listening', 'heart', 'lung', 'diagnostic'],
            'stethoscopes': ['stethoscopes', 'listening', 'heart', 'lung', 'diagnostic'],
            
            # Delivery & Administration
            'delivery': ['delivery', 'administration', 'system', 'dispense', 'medical'],
            'administration': ['administration', 'delivery', 'dispense', 'medication', 'inject'],
            'syringe': ['syringe', 'injection', 'needle', 'medication', 'hypodermic'],
            'syringes': ['syringes', 'injections', 'needles', 'medication', 'hypodermic'],
            'needle': ['needle', 'injection', 'syringe', 'hypodermic', 'sharp'],
            'needles': ['needles', 'injections', 'syringes', 'hypodermic', 'sharp'],
            'hypodermic': ['hypodermic', 'needle', 'syringe', 'injection', 'subcutaneous'],
            'catheter': ['catheter', 'tube', 'insertion', 'medical', 'drainage'],
            'catheters': ['catheters', 'tubes', 'insertion', 'medical', 'drainage'],
            
            # Digital & Imaging
            'digital': ['digital', 'electronic', 'imaging', 'sensor', 'technology'],
            'xray': ['xray', 'radiograph', 'imaging', 'diagnostic', 'radiation'],
            'x-ray': ['x-ray', 'xray', 'radiograph', 'imaging', 'diagnostic'],
            'imaging': ['imaging', 'diagnostic', 'radiology', 'scan', 'picture'],
            'sensor': ['sensor', 'digital', 'detector', 'imaging', 'electronic'],
            'sensors': ['sensors', 'digital', 'detectors', 'imaging', 'electronic'],
            'camera': ['camera', 'imaging', 'photo', 'intraoral', 'dental'],
            'cameras': ['cameras', 'imaging', 'photo', 'intraoral', 'dental'],
            
            # Curtains & Privacy
            'curtain': ['curtain', 'privacy', 'screen', 'barrier', 'room'],
            'curtains': ['curtains', 'privacy', 'screens', 'barrier', 'room'],
            'privacy': ['privacy', 'screen', 'curtain', 'confidential', 'barrier'],
            'screen': ['screen', 'privacy', 'curtain', 'barrier', 'divider'],
            'screens': ['screens', 'privacy', 'curtains', 'barrier', 'divider'],
            
            # Marketing & Practice Management
            'marketing': ['marketing', 'promotion', 'advertising', 'practice', 'business'],
            'practice': ['practice', 'office', 'clinic', 'dental', 'medical'],
            'office': ['office', 'practice', 'administration', 'front', 'business'],
            'supplies': ['supplies', 'materials', 'consumables', 'inventory', 'stock'],
            
            # Sterilization & Reprocessing
            'sterilization': ['sterilization', 'autoclave', 'disinfection', 'infection', 'control'],
            'autoclave': ['autoclave', 'sterilization', 'sterilizer', 'pressure', 'steam'],
            'disinfect': ['disinfect', 'clean', 'sterilize', 'sanitize', 'infection'],
            'disinfection': ['disinfection', 'cleaning', 'sterilization', 'sanitization', 'infection'],
            'reprocessing': ['reprocessing', 'sterilization', 'cleaning', 'instrument', 'preparation'],
            
            # Cardiology & Cardiac
            'cardio': ['cardio', 'heart', 'cardiac', 'cardiovascular', 'circulatory'],
            'cardiac': ['cardiac', 'heart', 'cardio', 'cardiovascular', 'circulatory'],
            'cardiovascular': ['cardiovascular', 'heart', 'cardiac', 'vascular', 'circulatory'],
            'heart': ['heart', 'cardiac', 'cardio', 'cardiovascular', 'pulse'],
            'ecg': ['ecg', 'ekg', 'electrocardiogram', 'heart', 'cardiac'],
            'ekg': ['ekg', 'ecg', 'electrocardiogram', 'heart', 'cardiac'],
            
            # Casting & Orthopedics
            'cast': ['cast', 'plaster', 'orthopedic', 'immobilize', 'fracture'],
            'casting': ['casting', 'plaster', 'orthopedic', 'immobilize', 'fracture'],
            'splint': ['splint', 'immobilize', 'stabilize', 'fracture', 'orthopedic'],
            'splinting': ['splinting', 'immobilize', 'stabilize', 'fracture', 'orthopedic'],
            'orthopedic': ['orthopedic', 'bone', 'joint', 'musculoskeletal', 'fracture'],
            'orthopedics': ['orthopedics', 'bone', 'joint', 'musculoskeletal', 'fracture'],
            
            # Milling & CAD/CAM
            'milling': ['milling', 'fabrication', 'cad', 'cam', 'dental'],
            'mill': ['mill', 'milling', 'fabrication', 'cad', 'cam'],
            'cad': ['cad', 'cam', 'digital', 'design', 'computer'],
            'cam': ['cam', 'cad', 'manufacturing', 'milling', 'fabrication'],
            'cadcam': ['cadcam', 'cad/cam', 'digital', 'milling', 'fabrication'],
            
            # Diagnostic Tools
            'diagnostic': ['diagnostic', 'diagnosis', 'exam', 'test', 'assessment'],
            'exam': ['exam', 'examination', 'diagnostic', 'assessment', 'inspection'],
            'examination': ['examination', 'exam', 'diagnostic', 'assessment', 'inspection'],
            'probe': ['probe', 'explorer', 'diagnostic', 'examination', 'dental'],
            'explorer': ['explorer', 'probe', 'diagnostic', 'examination', 'dental'],
            
            # Crown & Bridge
            'crown': ['crown', 'cap', 'restoration', 'dental', 'prosthetic'],
            'crowns': ['crowns', 'caps', 'restoration', 'dental', 'prosthetic'],
            'bridge': ['bridge', 'pontic', 'restoration', 'prosthetic', 'dental'],
            'bridges': ['bridges', 'pontics', 'restoration', 'prosthetic', 'dental'],
            'temporary': ['temporary', 'temp', 'provisional', 'interim', 'short-term'],
            'provisional': ['provisional', 'temporary', 'interim', 'temp', 'transitional'],
            
            # Drainage & Suction
            'drainage': ['drainage', 'drain', 'suction', 'evacuation', 'fluid'],
            'drain': ['drain', 'drainage', 'suction', 'evacuation', 'removal'],
            'suction': ['suction', 'evacuation', 'aspiration', 'vacuum', 'removal'],
            'evacuation': ['evacuation', 'suction', 'removal', 'drainage', 'hve'],
            'evacuator': ['evacuator', 'suction', 'evacuation', 'hve', 'dental'],
            'hve': ['hve', 'evacuator', 'suction', 'high-volume', 'evacuation'],
            
            # Organization & Storage
            'storage': ['storage', 'container', 'organization', 'holder', 'cabinet'],
            'organization': ['organization', 'storage', 'arrangement', 'system', 'order'],
            'container': ['container', 'storage', 'holder', 'box', 'organizer'],
            'tray': ['tray', 'organizer', 'holder', 'storage', 'container'],
            'trays': ['trays', 'organizers', 'holders', 'storage', 'containers'],
            
            # Brackets & Orthodontics
            'bracket': ['bracket', 'orthodontic', 'braces', 'attachment', 'dental'],
            'brackets': ['brackets', 'orthodontic', 'braces', 'attachments', 'dental'],
            'orthodontic': ['orthodontic', 'braces', 'bracket', 'alignment', 'dental'],
            'orthodontics': ['orthodontics', 'braces', 'brackets', 'alignment', 'dental'],
            'archwire': ['archwire', 'wire', 'orthodontic', 'braces', 'alignment'],
            'archwires': ['archwires', 'wires', 'orthodontic', 'braces', 'alignment'],
            'wire': ['wire', 'orthodontic', 'archwire', 'metal', 'braces'],
            
            # Culture & Laboratory Media
            'culture': ['culture', 'growth', 'bacteria', 'lab', 'microbiology'],
            'media': ['media', 'culture', 'growth', 'laboratory', 'microbiology'],
            'microbiology': ['microbiology', 'bacteria', 'culture', 'lab', 'organism'],
            
            # Chemicals & Solutions
            'chemical': ['chemical', 'solution', 'reagent', 'substance', 'compound'],
            'chemicals': ['chemicals', 'solutions', 'reagents', 'substances', 'compounds'],
            'solution': ['solution', 'liquid', 'chemical', 'reagent', 'fluid'],
            'solutions': ['solutions', 'liquids', 'chemicals', 'reagents', 'fluids'],
            'reagent': ['reagent', 'chemical', 'solution', 'test', 'laboratory'],
            'reagents': ['reagents', 'chemicals', 'solutions', 'tests', 'laboratory'],
            
            # Power & Electric Tools
            'power': ['power', 'electric', 'motor', 'drive', 'energy'],
            'electric': ['electric', 'powered', 'motor', 'electrical', 'battery'],
            'handpiece': ['handpiece', 'dental', 'drill', 'tool', 'rotary'],
            'handpieces': ['handpieces', 'dental', 'drills', 'tools', 'rotary'],
            
            # Retraction & Tissue Management
            'retractor': ['retractor', 'tissue', 'surgical', 'holding', 'exposure'],
            'retractors': ['retractors', 'tissue', 'surgical', 'holding', 'exposure'],
            'retraction': ['retraction', 'tissue', 'displacement', 'management', 'gingival'],
            
            # Technology & Systems
            'technology': ['technology', 'tech', 'digital', 'system', 'advanced'],
            'system': ['system', 'equipment', 'technology', 'device', 'apparatus'],
            'systems': ['systems', 'equipment', 'technology', 'devices', 'apparatus'],
            'unit': ['unit', 'system', 'device', 'equipment', 'machine'],
            'units': ['units', 'systems', 'devices', 'equipment', 'machines'],
            
            # Technology
            'technology': ['technology', 'tech', 'digital', 'computer', 'electronic'],
            'computer': ['computer', 'pc', 'technology', 'device', 'laptop'],
            'laptop': ['laptop', 'computer', 'notebook', 'device', 'portable'],
            'phone': ['phone', 'mobile', 'device', 'smartphone', 'cell'],
            'mobile': ['mobile', 'phone', 'smartphone', 'device', 'portable'],
            'tablet': ['tablet', 'device', 'ipad', 'mobile', 'touchscreen'],
            'wifi': ['wifi', 'wireless', 'network', 'internet', 'connection'],
            'network': ['network', 'connection', 'internet', 'wifi', 'web'],
            'internet': ['internet', 'web', 'network', 'online', 'connection'],
            'web': ['web', 'internet', 'www', 'online', 'browser'],
            'database': ['database', 'data', 'storage', 'server', 'information'],
            'server': ['server', 'database', 'network', 'cloud', 'hosting'],
            'cloud': ['cloud', 'storage', 'server', 'online', 'sync'],
            'sync': ['sync', 'synchronize', 'refresh', 'update', 'cloud'],
            'refresh': ['refresh', 'reload', 'sync', 'update', 'renew'],
            'update': ['update', 'upgrade', 'refresh', 'new', 'sync'],
            
            # Transportation
            'car': ['car', 'vehicle', 'auto', 'automobile', 'transport'],
            'vehicle': ['vehicle', 'car', 'transport', 'auto', 'transportation'],
            'truck': ['truck', 'vehicle', 'delivery', 'transport', 'lorry'],
            'plane': ['plane', 'airplane', 'flight', 'travel', 'aviation'],
            'airplane': ['airplane', 'plane', 'flight', 'travel', 'aviation'],
            'train': ['train', 'railway', 'rail', 'transport', 'station'],
            'ship': ['ship', 'boat', 'vessel', 'marine', 'nautical'],
            'boat': ['boat', 'ship', 'vessel', 'marine', 'water'],
            
            # Education
            'education': ['education', 'school', 'learning', 'teaching', 'study'],
            'school': ['school', 'education', 'learning', 'study', 'academy'],
            'book': ['book', 'read', 'education', 'learning', 'library'],
            'read': ['read', 'book', 'reading', 'study', 'literature'],
            'learning': ['learning', 'education', 'study', 'training', 'knowledge'],
            'study': ['study', 'learning', 'education', 'school', 'research'],
            'graduation': ['graduation', 'education', 'degree', 'school', 'diploma'],
            'certificate': ['certificate', 'diploma', 'credential', 'award', 'achievement'],
            
            # Additional Medical/Dental Supply Categories
            # Pins, Posts & Gutta Percha
            'pin': ['pin', 'post', 'endodontic', 'retention', 'dental'],
            'pins': ['pins', 'posts', 'endodontic', 'retention', 'dental'],
            'post': ['post', 'pin', 'endodontic', 'retention', 'core'],
            'posts': ['posts', 'pins', 'endodontic', 'retention', 'core'],
            'gutta': ['gutta', 'percha', 'endodontic', 'filling', 'root'],
            'percha': ['percha', 'gutta', 'endodontic', 'filling', 'root'],
            
            # Resins & Cements
            'resin': ['resin', 'composite', 'restoration', 'dental', 'material'],
            'resins': ['resins', 'composites', 'restoration', 'dental', 'materials'],
            'cement': ['cement', 'adhesive', 'bonding', 'luting', 'dental'],
            'cements': ['cements', 'adhesives', 'bonding', 'luting', 'dental'],
            'liner': ['liner', 'base', 'cement', 'protective', 'dental'],
            'liners': ['liners', 'bases', 'cements', 'protective', 'dental'],
            'bonding': ['bonding', 'adhesive', 'cement', 'attachment', 'dental'],
            
            # Eyewear & Protection
            'eyewear': ['eyewear', 'glasses', 'goggles', 'protection', 'safety'],
            'glasses': ['glasses', 'eyewear', 'spectacles', 'protection', 'vision'],
            'goggles': ['goggles', 'eyewear', 'protection', 'safety', 'shield'],
            
            # Scales & Measurement
            'scale': ['scale', 'weight', 'measurement', 'balance', 'weighing'],
            'scales': ['scales', 'weight', 'measurement', 'balance', 'weighing'],
            'measurement': ['measurement', 'measuring', 'scale', 'gauge', 'assessment'],
            'measuring': ['measuring', 'measurement', 'gauge', 'scale', 'dimension'],
            
            # Matrix & Impressioning
            'matrix': ['matrix', 'band', 'dental', 'restoration', 'forming'],
            'impression': ['impression', 'mold', 'cast', 'dental', 'imprint'],
            'impressioning': ['impressioning', 'impression', 'molding', 'casting', 'dental'],
            'alginate': ['alginate', 'impression', 'material', 'dental', 'mold'],
            
            # Patient Care & Mobility
            'patient': ['patient', 'care', 'person', 'individual', 'medical'],
            'mobility': ['mobility', 'movement', 'transfer', 'wheelchair', 'walker'],
            'walker': ['walker', 'mobility', 'ambulation', 'assist', 'support'],
            'wheelchair': ['wheelchair', 'mobility', 'transport', 'chair', 'patient'],
            'transfer': ['transfer', 'move', 'patient', 'mobility', 'transport'],
            
            # Positioning & Support
            'positioning': ['positioning', 'placement', 'support', 'alignment', 'arrangement'],
            'pillow': ['pillow', 'cushion', 'support', 'comfort', 'padding'],
            'pillows': ['pillows', 'cushions', 'support', 'comfort', 'padding'],
            'cushion': ['cushion', 'pillow', 'padding', 'support', 'comfort'],
            'cushions': ['cushions', 'pillows', 'padding', 'support', 'comfort'],
            
            # Rubber Dam & Isolation
            'rubber': ['rubber', 'dam', 'isolation', 'latex', 'dental'],
            'dam': ['dam', 'rubber', 'isolation', 'barrier', 'dental'],
            'isolation': ['isolation', 'dam', 'rubber', 'barrier', 'separation'],
            
            # Prophy & Prophylaxis
            'prophy': ['prophy', 'prophylaxis', 'cleaning', 'polishing', 'dental'],
            'prophylaxis': ['prophylaxis', 'prophy', 'cleaning', 'prevention', 'dental'],
            'paste': ['paste', 'prophy', 'polishing', 'cleaning', 'dental'],
            'angle': ['angle', 'prophy', 'handpiece', 'dental', 'attachment'],
            'angles': ['angles', 'prophy', 'handpieces', 'dental', 'attachments'],
            
            # Obturation & Endodontics
            'obturation': ['obturation', 'filling', 'endodontic', 'sealing', 'root'],
            'obturator': ['obturator', 'obturation', 'filling', 'endodontic', 'instrument'],
            'endodontic': ['endodontic', 'root', 'canal', 'pulp', 'dental'],
            'endodontics': ['endodontics', 'root', 'canal', 'pulp', 'dental'],
            'canal': ['canal', 'root', 'endodontic', 'pulp', 'dental'],
            'root': ['root', 'canal', 'endodontic', 'tooth', 'dental'],
            
            # Light Cure & Curing
            'cure': ['cure', 'curing', 'polymerization', 'hardening', 'setting'],
            'curing': ['curing', 'cure', 'polymerization', 'hardening', 'light'],
            
            # Mixing & Dispensing
            'mixing': ['mixing', 'blending', 'combination', 'dispensing', 'preparation'],
            'dispenser': ['dispenser', 'dispense', 'distribution', 'delivery', 'applicator'],
            'dispensers': ['dispensers', 'dispense', 'distribution', 'delivery', 'applicators'],
            'dispense': ['dispense', 'distribute', 'deliver', 'apply', 'administer'],
            
            # Fluoride & Preventive
            'fluoride': ['fluoride', 'preventive', 'treatment', 'dental', 'protection'],
            'preventive': ['preventive', 'prevention', 'prophylactic', 'protective', 'dental'],
            'sealant': ['sealant', 'sealing', 'preventive', 'protection', 'dental'],
            
            # Whitening & Cosmetic
            'whitening': ['whitening', 'bleaching', 'cosmetic', 'brightening', 'aesthetic'],
            'bleaching': ['bleaching', 'whitening', 'cosmetic', 'lightening', 'aesthetic'],
            'cosmetic': ['cosmetic', 'aesthetic', 'beauty', 'appearance', 'dental'],
            'aesthetic': ['aesthetic', 'cosmetic', 'beauty', 'appearance', 'dental'],
            
            # Stone & Model Materials
            'stone': ['stone', 'gypsum', 'model', 'cast', 'dental'],
            'gypsum': ['gypsum', 'stone', 'plaster', 'model', 'dental'],
            'model': ['model', 'cast', 'replica', 'impression', 'dental'],
            
            # Articulating & Occlusion
            'articulating': ['articulating', 'occlusion', 'bite', 'contact', 'dental'],
            'articulator': ['articulator', 'jaw', 'model', 'dental', 'prosthetic'],
            'occlusion': ['occlusion', 'bite', 'contact', 'articulating', 'dental'],
            'bite': ['bite', 'occlusion', 'registration', 'dental', 'jaw'],
            
            # Irrigation & Cleaning
            'irrigation': ['irrigation', 'flushing', 'cleaning', 'rinsing', 'fluid'],
            'irrigating': ['irrigating', 'irrigation', 'flushing', 'cleaning', 'rinsing'],
            'rinse': ['rinse', 'irrigation', 'flushing', 'cleaning', 'wash'],
            
            # Vacuum & Pumps
            'vacuum': ['vacuum', 'suction', 'negative', 'pressure', 'evacuation'],
            'pump': ['pump', 'vacuum', 'suction', 'pressure', 'device'],
            'pumps': ['pumps', 'vacuum', 'suction', 'pressure', 'devices'],
            
            # Autoclaves & Sterilizers
            'sterilizer': ['sterilizer', 'autoclave', 'sterilization', 'disinfection', 'equipment'],
            'sterilizers': ['sterilizers', 'autoclaves', 'sterilization', 'disinfection', 'equipment'],
            
            # Workstations & Benches
            'workstation': ['workstation', 'desk', 'bench', 'work', 'station'],
            'workstations': ['workstations', 'desks', 'benches', 'work', 'stations'],
            'bench': ['bench', 'workstation', 'table', 'work', 'surface'],
            
            # Boxes & Containers
            'box': ['box', 'container', 'case', 'storage', 'holder'],
            'boxes': ['boxes', 'containers', 'cases', 'storage', 'holders'],
            'case': ['case', 'box', 'container', 'storage', 'holder'],
            
            # Strips & Finishing
            'strip': ['strip', 'abrasive', 'finishing', 'polishing', 'dental'],
            'strips': ['strips', 'abrasive', 'finishing', 'polishing', 'dental'],
            'finishing': ['finishing', 'polishing', 'smoothing', 'abrasive', 'final'],
            'abrasive': ['abrasive', 'grinding', 'polishing', 'finishing', 'rough'],
            'abrasives': ['abrasives', 'grinding', 'polishing', 'finishing', 'rough'],
            
            # Gloves & Hand Protection
            'glove': ['glove', 'hand', 'protection', 'ppe', 'disposable'],
            'gloves': ['gloves', 'hand', 'protection', 'ppe', 'disposable'],
            'hand': ['hand', 'glove', 'manual', 'grip', 'finger'],
            
            # Nitrous Oxide & Sedation
            'nitrous': ['nitrous', 'oxide', 'sedation', 'anesthesia', 'gas'],
            'oxide': ['oxide', 'nitrous', 'gas', 'anesthesia', 'sedation'],
            
            # Glass Ionomer & Materials
            'glass': ['glass', 'ionomer', 'cement', 'restorative', 'dental'],
            'ionomer': ['ionomer', 'glass', 'cement', 'restorative', 'dental'],
            
            # Wax & Laboratory
            'wax': ['wax', 'dental', 'laboratory', 'modeling', 'impression'],
            'waxing': ['waxing', 'wax', 'modeling', 'dental', 'laboratory'],
            
            # Porcelain & Ceramics
            'porcelain': ['porcelain', 'ceramic', 'crown', 'veneer', 'dental'],
            'ceramic': ['ceramic', 'porcelain', 'crown', 'restoration', 'dental'],
            'ceramics': ['ceramics', 'porcelain', 'crown', 'restoration', 'dental'],
            
            # Denture & Prosthetics
            'denture': ['denture', 'prosthetic', 'false', 'teeth', 'removable'],
            'dentures': ['dentures', 'prosthetic', 'false', 'teeth', 'removable'],
            'prosthetic': ['prosthetic', 'artificial', 'replacement', 'implant', 'device'],
            'prosthetics': ['prosthetics', 'artificial', 'replacement', 'implant', 'devices'],
            
            # Alloy & Amalgam
            'alloy': ['alloy', 'metal', 'amalgam', 'mixture', 'dental'],
            'alloys': ['alloys', 'metals', 'amalgam', 'mixtures', 'dental'],
            'amalgam': ['amalgam', 'alloy', 'filling', 'silver', 'dental'],
            'silver': ['silver', 'amalgam', 'metal', 'alloy', 'dental'],
            
            # Loupes & Magnification
            'loupe': ['loupe', 'magnification', 'vision', 'optical', 'dental'],
            'loupes': ['loupes', 'magnification', 'vision', 'optical', 'dental'],
            'magnification': ['magnification', 'loupe', 'zoom', 'enlargement', 'optical'],
            
            # Laser & Advanced Technology
            'laser': ['laser', 'light', 'surgical', 'cutting', 'technology'],
            'lasers': ['lasers', 'light', 'surgical', 'cutting', 'technology'],
            
            # Sleep Medicine & CPAP
            'sleep': ['sleep', 'apnea', 'cpap', 'breathing', 'respiratory'],
            'cpap': ['cpap', 'sleep', 'apnea', 'breathing', 'mask'],
            'apnea': ['apnea', 'sleep', 'breathing', 'disorder', 'respiratory'],
            
            # Dialysis & Renal
            'dialysis': ['dialysis', 'renal', 'kidney', 'filtration', 'treatment'],
            'renal': ['renal', 'kidney', 'dialysis', 'urinary', 'medical'],
            'kidney': ['kidney', 'renal', 'dialysis', 'organ', 'urinary'],
            
            # Incontinence & Urinary
            'incontinence': ['incontinence', 'urinary', 'bladder', 'control', 'management'],
            'urinary': ['urinary', 'urine', 'bladder', 'kidney', 'renal'],
            'bladder': ['bladder', 'urinary', 'urine', 'incontinence', 'organ'],
            
            # Nutrition & Feeding
            'nutrition': ['nutrition', 'feeding', 'diet', 'food', 'supplement'],
            'feeding': ['feeding', 'nutrition', 'eating', 'food', 'nourishment'],
            'supplement': ['supplement', 'vitamin', 'nutrition', 'dietary', 'addition'],
            'supplements': ['supplements', 'vitamins', 'nutrition', 'dietary', 'additions'],
            'vitamin': ['vitamin', 'supplement', 'nutrition', 'dietary', 'nutrient'],
            'vitamins': ['vitamins', 'supplements', 'nutrition', 'dietary', 'nutrients'],
        }
        
        # Visual characteristic tags (based on SVG analysis)
        self.shape_tags = {
            'circle': ['circular', 'round', 'sphere'],
            'rect': ['rectangular', 'square', 'box'],
            'polygon': ['geometric', 'angular', 'shape'],
            'line': ['linear', 'straight', 'line'],
            'path': ['custom', 'vector', 'drawn'],
        }
        
        # Category-based tags
        self.category_tags = {
            'backgrounds': ['background', 'backdrop', 'pattern', 'texture'],
            'business': ['business', 'corporate', 'professional', 'work'],
            'dental': ['dental', 'medical', 'healthcare', 'clinical'],
            'medical': ['medical', 'health', 'healthcare', 'clinical'],
            'communication': ['communication', 'messaging', 'contact', 'interaction'],
            'navigation': ['navigation', 'direction', 'wayfinding', 'interface'],
            'social': ['social', 'network', 'community', 'sharing'],
            'education': ['education', 'learning', 'academic', 'teaching'],
        }

    def extract_keywords_from_id(self, icon_id: str) -> List[str]:
        """Extract meaningful keywords from icon ID."""
        # Remove common prefixes
        id_clean = re.sub(r'^(HS_US_EN_|Wireblock_|non-scaling-stroke-\d+_)', '', icon_id)
        
        # Split by underscores and hyphens, convert to lowercase
        parts = re.split(r'[-_]', id_clean.lower())
        
        # Remove common words that don't add meaning
        stop_words = {'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'at'}
        keywords = [p for p in parts if p and p not in stop_words]
        
        return keywords

    def analyze_svg_content(self, svg_content: str) -> Set[str]:
        """Analyze SVG content for visual characteristics."""
        tags = set()
        
        # Check for various SVG elements
        if '<circle' in svg_content or 'circle' in svg_content.lower():
            tags.update(self.shape_tags.get('circle', []))
        if '<rect' in svg_content or 'rect' in svg_content.lower():
            tags.update(self.shape_tags.get('rect', []))
        if '<polygon' in svg_content or 'polygon' in svg_content.lower():
            tags.update(self.shape_tags.get('polygon', []))
        if '<line' in svg_content or 'line' in svg_content.lower():
            tags.update(self.shape_tags.get('line', []))
        if '<path' in svg_content:
            tags.update(self.shape_tags.get('path', []))
            
        return tags

    def generate_tags_for_icon(self, icon: Dict, svg_content: str = "") -> List[str]:
        """Generate comprehensive tags for an icon."""
        all_tags = set()
        
        # Extract keywords from ID
        keywords = self.extract_keywords_from_id(icon['id'])
        
        # Add tags based on keywords
        for keyword in keywords:
            # Add the keyword itself
            all_tags.add(keyword)
            
            # Add related tags from keyword_tags dictionary
            if keyword in self.keyword_tags:
                all_tags.update(self.keyword_tags[keyword])
        
        # Add category-based tags
        category = icon.get('category', '').lower()
        if category in self.category_tags:
            all_tags.update(self.category_tags[category])
        
        # Add type-based tags
        icon_type = icon.get('type', '').lower()
        if icon_type:
            all_tags.add(icon_type)
        
        # Analyze SVG content if provided
        if svg_content:
            all_tags.update(self.analyze_svg_content(svg_content))
        
        # Convert to sorted list, remove duplicates
        tags_list = sorted(list(all_tags))
        
        # Limit to most relevant tags (optional, adjust as needed)
        # You might want to prioritize certain tags or limit the total number
        return tags_list[:20]  # Limit to top 20 tags

    def process_config_file(self, config_path: str, svg_path: str = None, output_path: str = None):
        """Process the entire config file and add tags to all icons."""
        # Read the config file
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Read SVG file if provided
        svg_content_map = {}
        if svg_path and Path(svg_path).exists():
            with open(svg_path, 'r', encoding='utf-8') as f:
                svg_full = f.read()
                # Try to extract individual icon SVG content by symbol id
                symbols = re.findall(r'<symbol id="([^"]+)"[^>]*>(.*?)</symbol>', svg_full, re.DOTALL)
                for symbol_id, symbol_content in symbols:
                    svg_content_map[symbol_id] = symbol_content
        
        # Process each icon
        total_icons = len(config.get('icons', []))
        print(f"Processing {total_icons} icons...")
        
        for i, icon in enumerate(config.get('icons', []), 1):
            # Get SVG content for this specific icon if available
            icon_svg = svg_content_map.get(icon['id'], '')
            
            # Generate tags
            tags = self.generate_tags_for_icon(icon, icon_svg)
            
            # Add tags to icon
            icon['tags'] = tags
            
            # Progress indicator
            if i % 100 == 0:
                print(f"Processed {i}/{total_icons} icons...")
        
        print(f"Completed processing all {total_icons} icons!")
        
        # Write output
        if output_path is None:
            output_path = config_path.replace('.json', '-tagged.json')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        print(f"Tagged config saved to: {output_path}")
        
        # Print some statistics
        self.print_statistics(config)
        
        return output_path

    def print_statistics(self, config: Dict):
        """Print statistics about the tagging."""
        icons = config.get('icons', [])
        
        if not icons:
            return
        
        total_tags = sum(len(icon.get('tags', [])) for icon in icons)
        avg_tags = total_tags / len(icons)
        
        # Get most common tags
        all_tags = []
        for icon in icons:
            all_tags.extend(icon.get('tags', []))
        
        from collections import Counter
        tag_counts = Counter(all_tags)
        
        print("\n" + "="*50)
        print("TAGGING STATISTICS")
        print("="*50)
        print(f"Total icons: {len(icons)}")
        print(f"Total tags generated: {total_tags}")
        print(f"Average tags per icon: {avg_tags:.1f}")
        print(f"\nTop 20 most common tags:")
        for tag, count in tag_counts.most_common(20):
            print(f"  {tag}: {count}")
        print("="*50)


def main():
    """Main function to run the tagger."""
    import sys
    
    # Default paths
    config_path = "./dist/hs-icons-master-config.json"
    svg_path = "./dist/svg-code.txt"
    output_path = "./dist/hs-icons-master-config-tagged.json"
    
    # Allow command line arguments
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    if len(sys.argv) > 2:
        svg_path = sys.argv[2]
    if len(sys.argv) > 3:
        output_path = sys.argv[3]
    
    print("="*50)
    print("Icon Auto-Tagging Script")
    print("="*50)
    print(f"Config file: {config_path}")
    print(f"SVG file: {svg_path}")
    print(f"Output file: {output_path}")
    print("="*50 + "\n")
    
    # Create tagger and process
    tagger = IconTagger()
    result_path = tagger.process_config_file(config_path, svg_path, output_path)
    
    print(f"\n✓ Success! Tagged file created at: {result_path}")
    print("\nYou can now use the tagged JSON file in your application.")
    print("Each icon now has a 'tags' array with relevant keywords for searching and filtering.")


if __name__ == "__main__":
    main()