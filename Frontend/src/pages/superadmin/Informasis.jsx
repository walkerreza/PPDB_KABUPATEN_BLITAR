import React, { useState, useRef, useEffect } from 'react';
import { Card, Typography, Spinner } from "@material-tailwind/react";
import SuperAdminSidebar from '../../components/common/superadmin/SuperAdminSidebar';
import SuperAdminHeader from '../../components/common/superadmin/SuperAdminHeader';
import SuperAdminFooter from '../../components/common/superadmin/SuperAdminFooter';
import JoditEditor from 'jodit-react';
import { SaveButton } from '../../components/element/Button/variant';
import { toast } from 'react-toastify';
import { SuperAdminGuard } from '../../utils/AuthGuard';

const Informasis = () => {
  const editor = useRef(null);
  const [content, setContent] = useState('');
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSaving, setIsSaving] = useState(false);
  const [informasiId, setInformasiId] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsOpen(width >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (editor.current) {
        editor.current.destruct();
      }
    };
  }, []);

  const config = {
    readonly: false,
    height: isMobile ? 300 : 500,
    width: '100%',
    placeholder: 'Mulai menulis informasi...',
    language: 'id',
    toolbarButtonSize: isMobile ? 'small' : 'medium',
    enableDragAndDropFileToEditor: true,
    uploader: {
      insertImageAsBase64URI: true
    },
    buttons: isMobile ? [
      'paragraph', '|',
      'bold', 'italic', '|',
      'ul', 'ol', '|',
      'link', 'image', 'video', '|',
      'undo', 'redo'
    ] : [
      'source', '|',
      'paragraph', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', 'brush', '|',
      'align', '|',
      'ul', 'ol', '|',
      'table', 'link', 'image', 'video', '|',
      'indent', 'outdent', '|',
      'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    controls: {
      paragraph: {
        list: {
          'p': 'Paragraph',
          'h1': 'Heading 1',
          'h2': 'Heading 2',
          'h3': 'Heading 3',
          'h4': 'Heading 4',
          'blockquote': 'Quote',
          'pre': 'Code'
        }
      },
      image: {
        popup: (editor, current, control, close) => {
          const form = document.createElement('form');
          form.classList.add('jodit-form');
          form.innerHTML = `
            <div class="jodit-form__group">
              <label>Upload Gambar (Max 2MB)</label>
              <input type="file" accept="image/*" class="jodit-input" id="imageInput"/>
            </div>
            <div class="jodit-form__group">
              <label>Atau masukkan URL gambar</label>
              <input type="text" class="jodit-input" id="imageUrl" placeholder="https://..."/>
            </div>
            <div class="jodit-form__group">
              <button type="submit" class="jodit-button">Sisipkan Gambar</button>
            </div>
          `;

          const processImage = (file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;
                  
                  // Jika gambar terlalu besar, resize dengan aspek rasio yang sama
                  const MAX_WIDTH = 800;
                  const MAX_HEIGHT = 600;
                  
                  if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                  }
                  if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                  }
                  
                  canvas.width = width;
                  canvas.height = height;
                  
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // Konversi ke base64 dengan kualitas 0.7 (70%)
                  const base64 = canvas.toDataURL('image/jpeg', 0.7);
                  resolve(base64);
                };
                img.onerror = reject;
                img.src = e.target.result;
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          };

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = form.querySelector('#imageInput');
            const urlInput = form.querySelector('#imageUrl');
            
            if (input.files[0]) {
              const file = input.files[0];
              
              // Check file size (max 2MB)
              if (file.size > 2 * 1024 * 1024) {
                toast.error('Ukuran gambar terlalu besar (maksimal 2MB)');
                return;
              }

              try {
                const optimizedImage = await processImage(file);
                editor.selection.insertImage(optimizedImage);
                close();
              } catch (error) {
                toast.error('Gagal memproses gambar: ' + error.message);
              }
            } else if (urlInput.value.trim()) {
              editor.selection.insertImage(urlInput.value.trim());
              close();
            }
          });

          return form;
        }
      },
      video: {
        popup: (editor, current, control, close) => {
          const form = document.createElement('form');
          form.classList.add('jodit-form');
          form.innerHTML = `
            <div class="jodit-form__group">
              <label>URL Video (YouTube/Vimeo)</label>
              <input class="jodit-input" type="text" required id="videoUrl"/>
            </div>
            <div class="jodit-form__group">
              <label>Lebar</label>
              <input class="jodit-input" type="number" value="640" id="videoWidth"/>
            </div>
            <div class="jodit-form__group">
              <label>Tinggi</label>
              <input class="jodit-input" type="number" value="360" id="videoHeight"/>
            </div>
            <div class="jodit-form__group" id="previewContainer" style="display: none; margin-top: 10px;">
              <label>Preview</label>
              <div id="videoPreview" style="width: 100%; max-width: 640px; margin: 10px auto;"></div>
            </div>
            <div class="jodit-form__group" style="display: flex; gap: 10px;">
              <button type="button" class="jodit-button" id="previewBtn">Preview</button>
              <button type="submit" class="jodit-button">Sisipkan Video</button>
            </div>
          `;

          const urlInput = form.querySelector('#videoUrl');
          const previewBtn = form.querySelector('#previewBtn');
          const previewContainer = form.querySelector('#previewContainer');
          const videoPreview = form.querySelector('#videoPreview');

          const generateVideoCode = (url, width, height, forPreview = false) => {
            let videoCode = '';
            
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
              const videoId = url.includes('youtube.com') 
                ? url.split('v=')[1]?.split('&')[0]
                : url.split('youtu.be/')[1]?.split('?')[0];
                
              if (videoId) {
                videoCode = `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1em 0;">
                  <iframe 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                  </iframe>
                </div>`;
              }
            }
            else if (url.includes('vimeo.com')) {
              const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
              if (videoId) {
                videoCode = `<div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1em 0;">
                  <iframe 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                    src="https://player.vimeo.com/video/${videoId}?autoplay=1" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen>
                  </iframe>
                </div>`;
              }
            }
            else if (url.match(/\.(mp4|webm|ogg)$/i)) {
              videoCode = `<div class="video-container" style="max-width: 100%; margin: 1em 0;">
                <video 
                  width="${width}" 
                  height="${height}" 
                  controls 
                  autoplay
                  playsinline
                  style="max-width: 100%; height: auto;">
                  <source src="${url}" type="video/${url.split('.').pop().toLowerCase()}">
                  Browser Anda tidak mendukung tag video.
                </video>
              </div>`;
            }

            return videoCode;
          };

          previewBtn.addEventListener('click', () => {
            const url = urlInput.value;
            const width = form.querySelector('#videoWidth').value;
            const height = form.querySelector('#videoHeight').value;

            if (url) {
              const videoCode = generateVideoCode(url, width, height, true);
              if (videoCode) {
                videoPreview.innerHTML = videoCode;
                previewContainer.style.display = 'block';
              } else {
                alert('URL video tidak valid. Harap masukkan URL YouTube, Vimeo, atau file video langsung (mp4/webm/ogg).');
              }
            } else {
              alert('Harap masukkan URL video terlebih dahulu.');
            }
          });

          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = urlInput.value;
            const width = form.querySelector('#videoWidth').value;
            const height = form.querySelector('#videoHeight').value;
            
            const videoCode = generateVideoCode(url, width, height);

            if (videoCode) {
              editor.selection.insertHTML(videoCode);
              close();
            } else {
              alert('URL video tidak valid. Harap masukkan URL YouTube, Vimeo, atau file video langsung (mp4/webm/ogg).');
            }
          });

          return form;
        }
      },
      ul: {
        list: {
          'default': 'Bullet List',
          circle: 'Circle',
          disc: 'Disc',
          square: 'Square'
        },
        tags: ['ul']
      },
      ol: {
        list: {
          'default': 'Numbered List',
          'lower-alpha': 'Lower Alpha',
          'upper-alpha': 'Upper Alpha',
          'lower-roman': 'Lower Roman',
          'upper-roman': 'Upper Roman'
        },
        tags: ['ol']
      }
    },
    events: {
      afterInit: (instance) => {
        if (editor.current) {
          editor.current = instance;
        }
      },
      createEditor: (instance) => {
        const style = document.createElement('style');
        style.textContent = `
          .jodit-wysiwyg {
            font-family: Arial, sans-serif;
          }
          .jodit-wysiwyg h1 {
            font-size: 2em !important;
            font-weight: bold !important;
            margin: 0.67em 0 !important;
            color: #2d3748 !important;
          }
          .jodit-wysiwyg h2 {
            font-size: 1.5em !important;
            font-weight: bold !important;
            margin: 0.83em 0 !important;
            color: #2d3748 !important;
          }
          .jodit-wysiwyg h3 {
            font-size: 1.17em !important;
            font-weight: bold !important;
            margin: 1em 0 !important;
            color: #2d3748 !important;
          }
          .jodit-wysiwyg h4 {
            font-size: 1em !important;
            font-weight: bold !important;
            margin: 1.33em 0 !important;
            color: #2d3748 !important;
          }
          .jodit-wysiwyg ul, .jodit-wysiwyg ol {
            list-style-position: inside !important;
            margin: 1em 0 !important;
            padding: 0 0 0 40px !important;
          }
          .jodit-wysiwyg ul {
            list-style-type: disc !important;
          }
          .jodit-wysiwyg ol {
            list-style-type: decimal !important;
          }
          .jodit-wysiwyg ul li, .jodit-wysiwyg ol li {
            display: list-item !important;
            margin: 0.5em 0 !important;
            line-height: 1.5 !important;
          }
          .jodit-wysiwyg blockquote {
            margin: 1em 0 !important;
            padding: 0.5em 1em !important;
            border-left: 3px solid #718096 !important;
            background: #f7fafc !important;
            color: #4a5568 !important;
            font-style: italic !important;
          }
          .jodit-wysiwyg pre {
            background: #2d3748 !important;
            color: #e2e8f0 !important;
            padding: 1em !important;
            border-radius: 4px !important;
            overflow-x: auto !important;
            font-family: monospace !important;
          }
          .jodit-wysiwyg p {
            margin: 1em 0 !important;
            line-height: 1.5 !important;
          }
          .jodit-wysiwyg .video-container {
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
          }
          .jodit-wysiwyg .video-container video {
            display: block;
            margin: 0 auto;
          }
          .jodit-form__group {
            margin-bottom: 15px;
          }
          .jodit-form__group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
          }
          .jodit-form__group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
          }
          .jodit-button {
            background: #4299e1;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .jodit-button:hover {
            background: #3182ce;
          }
          #previewContainer {
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 4px;
            background: #f8fafc;
          }
          #videoPreview {
            background: white;
            padding: 10px;
            border-radius: 4px;
          }
        `;
        document.head.appendChild(style);
      },
      beforeImageUpload: function(images) {
        const maximum = 2 * 1024 * 1024; // 2MB
        return images.some(img => {
          if (img.size > maximum) {
            toast.error('Ukuran gambar terlalu besar. Maksimal 2MB');
            return false;
          }
          return true;
        });
      }
    },
    createAttributes: {
      img: {
        style: 'max-width: 100%; height: auto;'
      }
    },
    enter: 'div',
    enterBlock: 'div',
    defaultMode: '1',
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    beautifyHTML: true,
    cleanHTML: {
      fillEmptyParagraph: false,
      removeEmptyElements: false,
      replaceNBSP: false,
      cleanOnPaste: true
    }
  };

  // Fungsi untuk mendapatkan headers dengan token
  const getHeaders = (includeContentType = true) => {
    try {
      // Ambil data user dari localStorage
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) {
        throw new Error('Data user tidak ditemukan');
      }

      const userData = JSON.parse(userDataString);
      const token = userData.token;

      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const headers = new Headers();
      headers.append('Authorization', `Bearer ${token}`);
      
      if (includeContentType) {
        headers.append('Content-Type', 'application/json');
      }
      
      return headers;
    } catch (error) {
      console.error('Error getting headers:', error);
      toast.error('Sesi anda telah berakhir, silahkan login kembali');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return new Headers();
    }
  };

  const handleSave = async () => {
    if (!content?.trim()) {
      toast.error('Konten tidak boleh kosong');
      return;
    }

    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        judul: 'Informasi PPDB',
        deskripsi: content,
        status: 1
      };

      // Jika tidak ada informasiId, buat baru
      if (!informasiId) {
        const createResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/informasi`,
          {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          }
        );

        const createResult = await createResponse.json();
        if (!createResponse.ok) {
          throw new Error(createResult.message || 'Gagal membuat informasi baru');
        }

        setInformasiId(createResult.data.id_informasi);
        toast.success('Informasi berhasil dibuat');
        return;
      }

      // Update informasi yang ada
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/informasi/${informasiId}`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal memperbarui informasi');
      }

      toast.success('Informasi berhasil diperbarui');
      
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Gagal menyimpan informasi');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchInformasi = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/informasi`,
          {
            headers: getHeaders()
          }
        );

        if (!response.ok) {
          throw new Error('Gagal mengambil data informasi');
        }

        const data = await response.json();
        if (data.length > 0) {
          const latestInfo = data[0];
          setContent(latestInfo.deskripsi || '');
          setInformasiId(latestInfo.id_informasi);
        }
      } catch (error) {
        console.error('Error fetching informasi:', error);
        toast.error(error.message || 'Gagal mengambil data informasi');
      }
    };

    fetchInformasi();
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (  
    <SuperAdminGuard>
      <div className="min-h-screen flex flex-col bg-[#EBEBEB]">
        <div className="fixed top-0 w-full z-50">
          <SuperAdminHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        <div className="flex flex-1 pt-[60px]">
          <div className="fixed left-0 h-[calc(100vh-73px)] z-40">
            <SuperAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />
          </div>
          
          <div className={`flex-1 ${isOpen ? 'md:ml-64' : ''}`}>
            <main className="p-4 md:p-8">
              <Card className="p-4 md:p-6">
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  Informasi
                </Typography>
                <div className="mt-4">
                  <JoditEditor
                    ref={editor}
                    value={content}
                    config={config}
                    onBlur={newContent => setContent(newContent)}
                    className="w-full"
                  />
                  
                  <div className="mt-4 flex justify-end">
                    <SaveButton 
                      onClick={handleSave} 
                      disabled={isSaving || !content?.trim()}
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" /> Menyimpan...
                        </div>
                      ) : 'Simpan Informasi'}
                    </SaveButton>
                  </div>
                </div>
              </Card>
            </main>
            <SuperAdminFooter />
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  );
};

export default Informasis;