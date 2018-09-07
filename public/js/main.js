const PORT = 9191;
const response = document.querySelector('#response');
const progressBar = document.querySelector('#progress');
const fileInput = document.querySelector('#file');
const bitRate = document.querySelector('#bitRate');

const uploadFile = () => {
  const formData = new FormData();
  const originalFileName = fileInput.files[0].name;
  formData.append('audioFile', fileInput.files[0]);
  axios
    .post('upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: progressEvent =>
        console.log(
          Math.floor((progressEvent.loaded * 100) / progressEvent.total)
        )
    })
    .then(res => {
      const socket = io.connect(
        `localhost:9191?bitRate=${bitRate.value}&file=${res.data.data.fileName}`
      );
      socket.on('progress', data => {
        progressBar.style.width = data + '%';
      });
      socket.on('done', outputFile => {
        response.innerText = 'Done, download should start soon';
        axios({
          url: `download/${outputFile}`,
          method: 'GET',
          responseType: 'blob'
        }).then(response => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            originalFileName.substr(0, originalFileName.lastIndexOf('.')) +
              '.mp3'
          );
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      });
    });
};
